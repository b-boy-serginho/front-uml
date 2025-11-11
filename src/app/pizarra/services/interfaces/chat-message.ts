import { UMLDiagram } from "../../interfaces/uml-models";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'diagram' | 'image' | 'audio';
  diagramData?: UMLDiagram;
  audioUrl?: string;
  imageUrl?: string;
  user?: {
    id: string;
    name: string;
    color: string;
  };
}