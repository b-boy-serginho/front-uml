import { Component, EventEmitter, Output, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../../share/services/theme.service';
import { ClaseComponent } from '../clase/clase.component';
import { UMLClass, UMLDiagram } from '../../interfaces/uml-models';
import { ChatComponent } from '../chat/chat.component';


export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ClaseComponent, ChatComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Output() itemSelected = new EventEmitter<string>();

  // Inputs para el componente de clase
  @Input() classes: UMLClass[] = [];
  @Input() selectedClass: UMLClass | null = null;

  @Output() addAttribute = new EventEmitter<string>();
  @Output() updateAttribute = new EventEmitter<{ classId: string, attributeId: string }>();
  @Output() deleteAttribute = new EventEmitter<{ classId: string, attributeId: string }>();
  @Output() addMethod = new EventEmitter<string>();
  @Output() updateMethod = new EventEmitter<{ classId: string, methodId: string }>();
  @Output() deleteMethod = new EventEmitter<{ classId: string, methodId: string }>();
  @Output() updateClassName = new EventEmitter<{ classId: string, newName: string }>();
  @Output() selectClass = new EventEmitter<string>();
  @Output() diagramGenerated = new EventEmitter<UMLDiagram>();

  isExpanded = false;
  activeItemId: string | null = null;
  public themeService = inject(ThemeService);
  menuItems: SidebarItem[] = [
    {
      id: 'classes',
      label: 'Clases',
      icon: '🏗️'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: '💬'
    },
  ];

  constructor() {
    this.activeItemId = 'projects';
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  selectItem(item: SidebarItem): void {
    // Si hacemos clic en el item activo y el sidebar está expandido, lo contraemos
    if (this.activeItemId === item.id && this.isExpanded) {
      this.isExpanded = false;
      return;
    }
    // Cambiar item activo
    this.activeItemId = item.id;
    // Expandir sidebar si no está expandido
    if (!this.isExpanded) {
      this.isExpanded = true;
    }
    // NO navegar automáticamente, solo expandir/contraer
    // La navegación se maneja desde el evento itemSelected
    // Emitir evento
    this.itemSelected.emit(item.id);
  }

  isActive(itemId: string): boolean {
    return this.activeItemId === itemId;
  }

  // Métodos para manejar eventos del componente de clase
  onClassAddAttribute(classId: string): void {
    this.addAttribute.emit(classId);
  }

  onClassUpdateAttribute(data: { classId: string, attributeId: string }): void {
    this.updateAttribute.emit(data);
  }

  onClassDeleteAttribute(data: { classId: string, attributeId: string }): void {
    this.deleteAttribute.emit(data);
  }

  onClassAddMethod(classId: string): void {
    this.addMethod.emit(classId);
  }

  onClassUpdateMethod(data: { classId: string, methodId: string }): void {
    this.updateMethod.emit(data);
  }

  onClassDeleteMethod(data: { classId: string, methodId: string }): void {
    this.deleteMethod.emit(data);
  }

  onClassUpdateClassName(data: { classId: string, newName: string }): void {
    this.updateClassName.emit(data);
  }

  onClassSelect(classId: string): void {
    this.selectClass.emit(classId);
  }

  onCloseClassPanel(): void {
    this.isExpanded = false;
    this.activeItemId = null;
  }

  // Manejar diagrama generado desde el chat
  onDiagramRequested(diagram: UMLDiagram): void {
    console.log('Sidebar recibió diagrama:', diagram);
    this.diagramGenerated.emit(diagram);
  }
}