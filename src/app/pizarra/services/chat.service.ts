import { Injectable, inject } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { UMLDiagram } from '../interfaces/uml-models';
import { v4 as uuidv4 } from 'uuid';
import { GeminiDiagramProvider } from '../providers/gemini.provider';
export type { ChatMessage } from './interfaces/chat-message';
import { ChatMessage } from './interfaces/chat-message';



@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messageSubject = new BehaviorSubject<ChatMessage[]>([]);
  private messages: ChatMessage[] = [];

  // Subject para emitir diagramas generados
  private diagramGeneratedSubject = new Subject<UMLDiagram>();
  public diagramGenerated$ = this.diagramGeneratedSubject.asObservable();

  // Subject para emitir clases individuales generadas
  private singleClassGeneratedSubject = new Subject<{ newClass: any, newRelations: any[] }>();
  public singleClassGenerated$ = this.singleClassGeneratedSubject.asObservable();

  private currentDiagram: UMLDiagram | null = null;

  private umlDiagramProvider = inject(GeminiDiagramProvider);

  constructor() {
    this.addSystemMessage('¡Hola! Soy tu asistente para crear diagramas UML. Escribe lo que necesites.');
  }

  private getUMLDiagramSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "string", description: "Identificador único del diagrama" },
        name: { type: "string", description: "Nombre del sistema UML" },
        classes: {
          type: "array",
          description: "Lista de clases UML",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "ID único de la clase" },
              name: { type: "string", description: "Nombre de la clase" },
              attributes: {
                type: "array",
                description: "Atributos de la clase",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "ID único del atributo" },
                    name: { type: "string", description: "Nombre del atributo" },
                    type: {
                      type: "string",
                      description: "Tipo de dato: String, Integer, Long, Double, Float, Boolean, Date, LocalDate, LocalDateTime, BigDecimal, byte[], UUID, List, Set, Map"
                    },
                    visibility: {
                      type: "string",
                      description: "Visibilidad: public, private, protected, package"
                    }
                  },
                  required: ["id", "name", "type", "visibility"]
                }
              },
              methods: {
                type: "array",
                description: "Métodos de la clase",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "ID único del método" },
                    name: { type: "string", description: "Nombre del método" },
                    returnType: { type: "string", description: "Tipo de retorno del método" },
                    visibility: {
                      type: "string",
                      description: "Visibilidad: public, private, protected, package"
                    }
                  },
                  required: ["id", "name", "returnType", "visibility"]
                }
              },
              position: {
                type: "object",
                properties: {
                  x: { type: "number", description: "Posición X" },
                  y: { type: "number", description: "Posición Y" }
                },
                required: ["x", "y"]
              },
              stereotype: { type: "string", description: "Estereotipo opcional: <<interface>>, <<abstract>>, <<association>>" }
            },
            required: ["id", "name", "attributes", "methods", "position"]
          }
        },
        relations: {
          type: "array",
          description: "Relaciones entre clases",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "ID único de la relación" },
              fromClassId: { type: "string", description: "ID de la clase origen" },
              toClassId: { type: "string", description: "ID de la clase destino" },
              type: {
                type: "string",
                description: "Tipo: association, aggregation, composition, inheritance, realization, dependency"
              },
              label: { type: "string", description: "Etiqueta de la relación" },
              multiplicity: {
                type: "object",
                properties: {
                  from: { type: "string", description: "Multiplicidad origen: 1, 0..1, 1..*, *, 0..*" },
                  to: { type: "string", description: "Multiplicidad destino: 1, 0..1, 1..*, *, 0..*" }
                },
                required: ["from", "to"]
              },
              associationClassId: { type: "string", description: "ID de la clase de asociación si aplica" }
            },
            required: ["id", "fromClassId", "toClassId", "type", "label", "multiplicity"]
          }
        }
      },
      required: ["id", "name", "classes", "relations"]
    };
  }

  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'system',
      content,
      timestamp: new Date(),
      type: 'text'
    };
    this.messages.push(message);
    this.messageSubject.next([...this.messages]);
  }

  addUserMessage(content: string): void {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      type: 'text'
    };
    this.messages.push(message);
    this.messageSubject.next([...this.messages]);
  }

  addAssistantMessage(content: string, diagramData?: UMLDiagram): void {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: diagramData ? 'diagram' : 'text',
      diagramData
    };
    this.messages.push(message);
    this.messageSubject.next([...this.messages]);
  }

  getMessages(): Observable<ChatMessage[]> {
    return this.messageSubject.asObservable();
  }

  getAllMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.messageSubject.next([]);
    this.addSystemMessage('Conversación limpiada.');
  }

  /**
   * Procesa el mensaje del usuario y genera diagrama o respuesta según sea necesario
   */
  async processUserMessage2(
    userMessage: string,
    messageType: 'text' | 'image' | 'audio' = 'text',
    file?: File | Blob
  ): Promise<UMLDiagram | void> {
    try {
      // Si es una imagen, generar diagrama desde imagen
      if (messageType === 'image' && file instanceof File) {
        const diagram = await this.umlDiagramProvider.generateUMLDiagramFromMediaFiles(file, undefined, userMessage);
        this.diagramGeneratedSubject.next(diagram);
        this.addAssistantMessage(
          `He analizado la imagen y generado un diagrama UML: "${diagram.name}". Contiene ${diagram.classes.length} clases y ${diagram.relations.length} relaciones. ¡Ya está dibujado! 🎨📷`,
          diagram
        );
        return diagram;
      }

      // Si es audio, generar diagrama desde audio
      if (messageType === 'audio' && file instanceof Blob) {
        const diagram = await this.umlDiagramProvider.generateUMLDiagramFromMediaFiles(undefined, file, userMessage);
        
        // Validar que el diagrama sea válido
        if (!diagram || !diagram.classes || !Array.isArray(diagram.classes)) {
          this.addAssistantMessage('❌ No pude generar un diagrama válido desde el audio. Intenta describir el sistema de otra manera.');
          return;
        }
        
        this.diagramGeneratedSubject.next(diagram);
        this.addAssistantMessage(
          `He transcrito tu audio y generado un diagrama UML: "${diagram.name}". Contiene ${diagram.classes.length} clases y ${diagram.relations?.length || 0} relaciones. ¡Ya está dibujado! 🎤🎨`,
          diagram
        );
        return diagram;
      }

      // Detectar si quiere agregar una clase individual
      const addClassPattern = /(?:agrega|añade|crea|genera)\s+(?:una\s+)?clase\s+(\w+)(?:\s+relacionad[ao]\s+con\s+)?(.+)?/i;
      const addClassMatch = userMessage.match(addClassPattern);
      
      if (addClassMatch) {
        await this.handleSingleClassGeneration(userMessage, addClassMatch);
        return;
      }

      // Si es texto, verificar si quiere un diagrama completo
      const diagramKeywords = ['diagrama', 'diseña', 'modela', 'sistema'];
      const wantsDiagram = diagramKeywords.some(keyword =>
        userMessage.toLowerCase().includes(keyword)
      );

      if (wantsDiagram) {
        const diagram = await this.umlDiagramProvider.generateUMLDiagram(userMessage, this.getUMLDiagramSchema());
        
        // Validar que el diagrama sea válido
        if (!diagram || !diagram.classes || !Array.isArray(diagram.classes)) {
          this.addAssistantMessage('❌ No pude generar un diagrama válido. Por favor, intenta reformular tu solicitud con más detalles.');
          return;
        }
        
        this.diagramGeneratedSubject.next(diagram);
        this.addAssistantMessage(
          `He generado un diagrama UML para: "${diagram.name}". Contiene ${diagram.classes.length} clases y ${diagram.relations?.length || 0} relaciones. ¡Ya está dibujado en el canvas! 🎨`,
          diagram
        );
        return diagram;
      } else {
        // Respuesta de texto normal
        const response = await this.umlDiagramProvider.generateTextResponse(userMessage);
        this.addAssistantMessage(response);
      }
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.addAssistantMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Maneja la generación de una clase individual mediante IA
   */
  private async handleSingleClassGeneration(userMessage: string, match: RegExpMatchArray): Promise<void> {
    const className = match[1];
    const relatedClassesText = match[2] || '';
    
    // Extraer nombres de clases relacionadas del mensaje
    const relatedClasses = this.extractClassNames(relatedClassesText);
    
    if (relatedClasses.length === 0) {
      this.addAssistantMessage(
        `Para generar la clase "${className}", necesito saber con qué clases existentes quieres relacionarla. ` +
        `Por ejemplo: "Agrega una clase Pedido relacionada con Cliente"`
      );
      return;
    }
    
    this.addAssistantMessage(`🔄 Generando clase "${className}" relacionada con: ${relatedClasses.join(', ')}...`);
    
    try {
      // Usar el diagrama actual si está disponible
      const diagram = this.currentDiagram || {
        id: 'temp',
        name: 'Current Diagram',
        classes: [],
        relations: []
      };
      
      const result = await this.umlDiagramProvider.generateSingleClass(
        className,
        relatedClasses,
        diagram,
        userMessage
      );
      
      this.singleClassGeneratedSubject.next(result);
      this.addAssistantMessage(
        `✅ He generado la clase "${className}" con ${result.newClass.attributes?.length || 0} atributos y ${result.newRelations.length} relaciones. ¡Ya está agregada al canvas! 🎨`
      );
    } catch (error) {
      console.error('Error al generar clase individual:', error);
      this.addAssistantMessage(`❌ No pude generar la clase "${className}". Intenta con una descripción más clara.`);
    }
  }

  /**
   * Extrae nombres de clases del texto
   */
  private extractClassNames(text: string): string[] {
    const words = text.split(/[\s,;y]+/).filter(w => w.length > 2);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  /**
   * Establece el diagrama actual para el contexto
   */
  setCurrentDiagram(diagram: UMLDiagram): void {
    this.currentDiagram = diagram;
  }
}
