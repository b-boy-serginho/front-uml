import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DiagramService } from '../../services/diagram.service';
import { Diagram } from '../../interfaces/diagram.interface';

@Component({
  selector: 'app-diagram-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './diagram-form.component.html',
  styleUrls: ['./diagram-form.component.css']
})
export class DiagramFormComponent implements OnInit {
  
  private diagramService = inject(DiagramService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  public myForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    tipo: ['class', [Validators.required]]
  });

  isEditMode = false;
  diagramId: string | null = null;
  projectId: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const projectIdParam = params.get('id');
      const diagramIdParam = params.get('diagramId');
      
      if (projectIdParam) {
        this.projectId = projectIdParam;
      }

      if (diagramIdParam) {
        this.isEditMode = true;
        this.diagramId = diagramIdParam;
        this.diagramService.getById(diagramIdParam).subscribe({
          next: (diagram) => {
            this.myForm.patchValue({
              name: diagram.name,
              description: diagram.description,
              tipo: diagram.tipo
            });
          },
          error: (err) => {
            console.error('Error loading diagram:', err);
          }
        });
      } else {
        this.isEditMode = false;
        this.diagramId = null;
      }
    });
  }

  save(): void {
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }

    const diagramData: Partial<Diagram> = {
      name: this.myForm.value.name,
      description: this.myForm.value.description,
      tipo: this.myForm.value.tipo,
      proyectoid: this.projectId
    };
    
    if (this.isEditMode && this.diagramId) {
      console.log('Updating diagram:', diagramData);
      this.diagramService.updateDiagram(this.diagramId, diagramData).subscribe({
        next: (diagram) => {
          console.log('Diagram updated successfully:', diagram);
          this.router.navigate(['/projects', this.projectId, 'diagrams']);
        },
        error: (err) => {
          console.error('Error updating diagram:', err);
        }
      });
    } else {
      console.log('Saving new diagram:', diagramData);
      this.diagramService.saveDiagram(diagramData).subscribe({
        next: (diagram) => {
          console.log('Diagram saved successfully:', diagram);
          // Redirigir directamente a la pizarra/canvas para empezar a crear clases
          this.router.navigate(['/diagrama/canvas', diagram.id]);
        },
        error: (err) => {
          console.error('Error saving diagram:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects', this.projectId, 'diagrams']);
  }

  isFieldInvalid(field: string): boolean {
    const formField = this.myForm.get(field);
    return !!(formField && formField.invalid && (formField.dirty || formField.touched));
  }
}
