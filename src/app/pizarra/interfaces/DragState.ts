export interface DragState {
  isDragging: boolean;
  draggedClass: string | null;
  offset: { x: number; y: number };
}


export interface DragPosition {
  x: number;
  y: number;
}

export interface DragOffset {
  x: number;
  y: number;
}