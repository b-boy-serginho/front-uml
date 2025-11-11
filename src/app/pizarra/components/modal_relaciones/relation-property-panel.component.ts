import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UMLRelation } from '../../interfaces/uml-models';


@Component({
  selector: 'app-relation-property-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relation-property-panel.component.html',
  styleUrls: ['./relation-property-panel.component.css']
})
export class RelationPropertyPanelComponent {
  @Input() selectedRelation: UMLRelation | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() updateRelation = new EventEmitter<UMLRelation>();
  @Output() deleteRelation = new EventEmitter<string>();
  @Output() createAssociationClass = new EventEmitter<string>();
  @Output() removeAssociationClass = new EventEmitter<string>();

  multiplicityPresets = ['1', '0..1', '1..*', '*', '0..*'];

  onClosePanel(): void {
    this.closePanel.emit();
  }

  onUpdateRelation(): void {
    if (this.selectedRelation) {
      this.updateRelation.emit(this.selectedRelation);
    }
  }

  onDeleteRelation(): void {
    if (this.selectedRelation && confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
      this.deleteRelation.emit(this.selectedRelation.id);
    }
  }

  hasAssociationClass(): boolean {
    return !!this.selectedRelation?.associationClassId;
  }

  onCreateAssociationClass(): void {
    if (this.selectedRelation) {
      this.createAssociationClass.emit(this.selectedRelation.id);
    }
  }

  onRemoveAssociationClass(): void {
    if (this.selectedRelation && confirm('¿Estás seguro de que quieres eliminar la clase de asociación?')) {
      this.removeAssociationClass.emit(this.selectedRelation.id);
    }
  }
}