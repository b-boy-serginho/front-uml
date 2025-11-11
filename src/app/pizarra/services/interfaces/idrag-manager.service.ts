import { DragPosition, DragState } from "../../interfaces/DragState";

export interface IDragManager {

    /**
       * Inicia el proceso de arrastre
       */
      startDrag(event: MouseEvent, classId: string): void;
    
      /**
       * Maneja el movimiento durante el arrastre
       */
      handleDragMove(event: MouseEvent): boolean ;
    
      /**
       * Finaliza el proceso de arrastre
       */
      endDrag(): void ;
    
      /**
       * Verifica si actualmente se está arrastrando un elemento
       */
      isDragging(): boolean;
    
      /**
       * Obtiene el ID de la clase que se está arrastrando actualmente
       */
      getDraggedClassId(): string | null ;
    
      /**
       * Obtiene el estado completo del arrastre
       */
      getDragState(): DragState;
    
      /**
       * Calcula la nueva posición basada en el evento y el offset
       */
      calculateNewPosition(event: MouseEvent, containerRect: DOMRect): DragPosition ;
    
      /**
       * Valida si una posición está dentro de los límites permitidos
       */
      isValidPosition(position: DragPosition, containerBounds: { width: number, height: number }): boolean ;
    
      /**
       * Ajusta una posición para que esté dentro de los límites
       */
      constrainPosition(position: DragPosition, containerBounds: { width: number, height: number }): DragPosition ;
    
      /**
       * Resetea el estado de arrastre (útil para casos de error)
       */
      resetDragState(): void ;
    
}