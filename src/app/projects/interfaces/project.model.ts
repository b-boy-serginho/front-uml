export enum visibilidad{
  publico = 'publico',

  privado = 'privado'

}
export interface Project {
  id: string;
  name: string;
  description: string;
  userId?: string;
  created: string;
  updated: string;
  visibility: string
}

