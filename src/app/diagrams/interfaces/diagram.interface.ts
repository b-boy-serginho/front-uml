export interface Diagram {
  id: string;
  proyecto_id: string;
  name: string;
  description: string;
  tipo: 'clases'; // Por ahora solo clases
  fecha_creacion: Date;
  fecha_modificacion: Date;
  activo: boolean;
}
