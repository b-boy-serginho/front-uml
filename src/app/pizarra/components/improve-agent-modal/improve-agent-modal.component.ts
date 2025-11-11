import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiDiagramProvider, ImprovementProgress } from '../../providers/gemini.provider';
import { UMLDiagram } from '../../interfaces/uml-models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-improve-agent-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './improve-agent-modal.component.html',
  styleUrls: ['./improve-agent-modal.component.css']
})
export class ImproveAgentModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() currentDiagram!: UMLDiagram;
  @Output() close = new EventEmitter<void>();
  @Output() diagramImproved = new EventEmitter<UMLDiagram>();

  contextPrompt = '';
  isProcessing = false;
  improvementProgress: ImprovementProgress | null = null;

  private geminiProvider = inject(GeminiDiagramProvider);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Escuchar progreso del proveedor
    this.geminiProvider.getImprovementProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.improvementProgress = progress;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    if (!this.isProcessing) {
      this.close.emit();
    }
  }

  async onImprove(): Promise<void> {
    if (!this.contextPrompt.trim()) {
      alert('Por favor ingresa un contexto para mejorar el diagrama');
      return;
    }

    this.isProcessing = true;
    this.improvementProgress = {
      steps: [],
      currentStep: 0,
      progress: 0
    };

    try {
      // Schema para validar el diagrama mejorado
      const schema = this.getUMLDiagramSchema();

      // Ejecutar agente mejorador
      const improvedDiagram = await this.geminiProvider.improveUMLDiagram(
        this.currentDiagram,
        this.contextPrompt,
        schema
      );

      // Emitir diagrama mejorado
      this.diagramImproved.emit(improvedDiagram);

      // Mostrar confirmación
      setTimeout(() => {
        alert('✅ ¡Diagrama mejorado exitosamente!');
        this.isProcessing = false;
        this.close.emit();
      }, 1000);
    } catch (error) {
      console.error('Error mejorando diagrama:', error);
      alert('❌ Error al mejorar el diagrama. Por favor intenta de nuevo.');
      this.isProcessing = false;
    }
  }

  private getUMLDiagramSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        classes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              attributes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    type: { type: "string" },
                    visibility: { type: "string" }
                  },
                  required: ["id", "name", "type", "visibility"]
                }
              },
              methods: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    returnType: { type: "string" },
                    visibility: { type: "string" }
                  },
                  required: ["id", "name", "returnType", "visibility"]
                }
              },
              position: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                },
                required: ["x", "y"]
              },
              stereotype: { type: "string" }
            },
            required: ["id", "name", "attributes", "methods", "position"]
          }
        },
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              fromClassId: { type: "string" },
              toClassId: { type: "string" },
              type: { type: "string" },
              label: { type: "string" },
              multiplicity: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" }
                },
                required: ["from", "to"]
              },
              associationClassId: { type: "string" }
            },
            required: ["id", "fromClassId", "toClassId", "type", "label", "multiplicity"]
          }
        }
      },
      required: ["id", "name", "classes", "relations"]
    };
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '⭕';
    }
  }
}
