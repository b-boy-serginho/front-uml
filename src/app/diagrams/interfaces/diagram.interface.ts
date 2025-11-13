export interface Diagram {
  id: string;
  proyectoid: string;
  name: string;
  description: string;
  tipo: 'class' | 'activity' | 'use_case' | 'sequence';
  fecha_creacion: Date;
  fecha_modificacion: Date;
}
