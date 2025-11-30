import { Component, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UMLDiagram } from '../../interfaces/uml-models';

@Component({
  selector: 'app-export-import-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-import-modal.component.html',
  styleUrls: ['./export-import-modal.component.css']
})
export class ExportImportModalComponent {
  @Input() isOpen = false;
  @Input() currentDiagram!: UMLDiagram;
  @Output() close = new EventEmitter<void>();
  @Output() exportImage = new EventEmitter<void>();
  @Output() exportPDF = new EventEmitter<void>();
  @Output() importJson = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onClose(): void {
    this.close.emit();
  }

  onExportImage(): void {
    this.exportImage.emit();
    this.onClose();
  }

  onExportPDF(): void {
    this.exportPDF.emit();
    this.onClose();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonContent = e.target?.result as string;
          this.importJson.emit(jsonContent);
          this.onClose();
        } catch (error) {
          alert('Error al leer el archivo JSON. Por favor verifica que el archivo sea válido.');
          console.error('Error importing JSON:', error);
        }
      };
      
      reader.readAsText(file);
    }
  }

  onImportClick(): void {
    this.fileInput.nativeElement.click();
  }
}

