import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UMLClass } from "../../interfaces/uml-models";

@Component({
    selector: 'app-clase',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './clase.component.html',
    styleUrls: ['./clase.component.css']
})
export class ClaseComponent {
    @Input() selectedClass: UMLClass | null = null;
    @Input() classes: UMLClass[] = [];
    
    @Output() addAttribute = new EventEmitter<string>();
    @Output() updateAttribute = new EventEmitter<{classId: string, attributeId: string}>();
    @Output() deleteAttribute = new EventEmitter<{classId: string, attributeId: string}>();
    @Output() addMethod = new EventEmitter<string>();
    @Output() updateMethod = new EventEmitter<{classId: string, methodId: string}>();
    @Output() deleteMethod = new EventEmitter<{classId: string, methodId: string}>();
    @Output() updateClassName = new EventEmitter<{classId: string, newName: string}>();
    @Output() selectClass = new EventEmitter<string>();
    @Output() closePanelEvent = new EventEmitter<void>();

    selectedClassId: string | null = null;

    onClassSelection(classId: string): void {
        this.selectedClassId = classId;
        this.selectClass.emit(classId);
    }

    onAddAttribute(): void {
        if (this.selectedClassId) {
            this.addAttribute.emit(this.selectedClassId);
        }
    }

    onUpdateAttribute(attributeId: string): void {
        if (this.selectedClassId) {
            this.updateAttribute.emit({classId: this.selectedClassId, attributeId});
        }
    }

    onDeleteAttribute(attributeId: string): void {
        if (this.selectedClassId) {
            this.deleteAttribute.emit({classId: this.selectedClassId, attributeId});
        }
    }

    onAddMethod(): void {
        if (this.selectedClassId) {
            this.addMethod.emit(this.selectedClassId);
        }
    }

    onUpdateMethod(methodId: string): void {
        if (this.selectedClassId) {
            this.updateMethod.emit({classId: this.selectedClassId, methodId});
        }
    }

    onDeleteMethod(methodId: string): void {
        if (this.selectedClassId) {
            this.deleteMethod.emit({classId: this.selectedClassId, methodId});
        }
    }

    onUpdateClassName(newName: string): void {
        if (this.selectedClassId) {
            this.updateClassName.emit({classId: this.selectedClassId, newName});
        }
    }

    getVisibilitySymbol(visibility: string): string {
        const symbols: { [key: string]: string } = {
            'public': '+',
            'private': '-',
            'protected': '#',
            'package': '~'
        };
        return symbols[visibility] || '+';
    }

    trackByAttributeId(index: number, attr: any): string {
        return attr.id;
    }

    trackByMethodId(index: number, method: any): string {
        return method.id;
    }

    closePanel(): void {
        this.closePanelEvent.emit();
    }
}
