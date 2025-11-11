import { Injectable } from '@angular/core';
import { UMLDiagramService } from './uml-diagram.service';
import { DragPosition, DragState } from '../interfaces/DragState';

@Injectable({
  providedIn: 'root'
})
export class DragManagerService {

  private dragState: DragState = {
    isDragging: false,
    draggedClass: null,
    offset: { x: 0, y: 0 }
  };

  constructor(private diagramService: UMLDiagramService) { }


  startDrag(event: MouseEvent, classId: string): void {
    event.stopPropagation();
    const classElement = event.currentTarget as HTMLElement;
    const rect = classElement.getBoundingClientRect();
    this.dragState = {
      isDragging: true,
      draggedClass: classId,
      offset: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    };
  }
  handleDragMove(event: MouseEvent): boolean {
    if (!this.dragState.isDragging || !this.dragState.draggedClass) return false;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const newPosition: DragPosition = {
      x: event.clientX - rect.left - this.dragState.offset.x,
      y: event.clientY - rect.top - this.dragState.offset.y
    };
    // Actualizar la posición de la clase en el servicio
    this.diagramService.updateClass(this.dragState.draggedClass, { position: newPosition });
    return true;
  }

  endDrag(): string | null {
    const draggedClass = this.dragState.draggedClass;
    this.dragState.isDragging = false;
    this.dragState.draggedClass = null;
    return draggedClass;
  }
  isDragging(): boolean {
    return this.dragState.isDragging;
  }
  getDraggedClassId(): string | null {
    return this.dragState.draggedClass;
  }
  getDragState(): DragState {
    return { ...this.dragState };
  }
  calculateNewPosition(event: MouseEvent, containerRect: DOMRect): DragPosition {
    return {
      x: event.clientX - containerRect.left - this.dragState.offset.x,
      y: event.clientY - containerRect.top - this.dragState.offset.y
    };
  }
  isValidPosition(position: DragPosition, containerBounds: { width: number, height: number }): boolean {
    const minX = 0;
    const minY = 0;
    const maxX = containerBounds.width - 180; // Ancho de clase UML
    const maxY = containerBounds.height - 200; // Altura mínima estimada de clase
    return position.x >= minX && position.x <= maxX &&
      position.y >= minY && position.y <= maxY;
  }
  constrainPosition(position: DragPosition, containerBounds: { width: number, height: number }): DragPosition {
    const minX = 0;
    const minY = 0;
    const maxX = containerBounds.width - 180;
    const maxY = containerBounds.height - 200;

    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y))
    };
  }
  resetDragState(): void {
    this.dragState = {
      isDragging: false,
      draggedClass: null,
      offset: { x: 0, y: 0 }
    };
  }
}