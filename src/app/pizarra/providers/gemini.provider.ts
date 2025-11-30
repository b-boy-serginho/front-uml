import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";
import { environment } from '../../../environments/environment';
import { UMLDiagram } from '../interfaces/uml-models';
import { Subject, Observable } from 'rxjs';

export interface ImprovementStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface ImprovementProgress {
  steps: ImprovementStep[];
  currentStep: number;
  progress: number; // 0-100
}

@Injectable({
  providedIn: 'root'
})
export class GeminiDiagramProvider {
  private ai = new GoogleGenAI({
    apiKey: environment.GOOGLE_GENAI_API_KEY
  });

  // Subject para emitir progreso de mejora
  private improvementProgressSubject = new Subject<ImprovementProgress>();
  public improvementProgress$ = this.improvementProgressSubject.asObservable();

  constructor() { }

  /**
   * Obtiene el schema JSON para la estructura del diagrama UML
   */
  

  /**
   * Genera un diagrama UML a partir de un prompt de texto
   */
  async generateUMLDiagram(userPrompt: string,getUMLDiagramSchema: any): Promise<UMLDiagram> {
    const prompt = `Genera un diagrama UML de clases para: ${userPrompt}.

Crea un objeto JSON con la estructura exacta indicada. 
Los tipos de datos deben ser válidos para Spring Boot.
Genera al menos 8-20 clases con atributos, y relaciones entre ellas.
Cada clase debe tener al menos 3-5 atributos y 2-3 métodos.
Las posiciones pueden comenzar en (100, 100) y distribuirse.
No incluyas métodos.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: getUMLDiagramSchema
        }
      });

      const diagram: UMLDiagram = JSON.parse(response.text || '{}');
      return diagram;
    } catch (error) {
      console.error('Error al generar diagrama UML:', error);
      throw error;
    }
  }

  /**
   * Genera un diagrama UML desde archivos multimedia (imagen o audio)
   */
  async generateUMLDiagramFromMediaFiles(
    imageFile?: File,
    audioFile?: Blob,
    additionalPrompt?: string,
    getUMLDiagramSchema?: any
  ): Promise<UMLDiagram> {
    try {
      let uploadedFile;
      let mediaPrompt = '';

      if (imageFile) {
        uploadedFile = await this.ai.files.upload({
          file: imageFile
        });
        mediaPrompt = `Analiza esta imagen y genera un diagrama UML de clases basado en lo que ves. 
        Fijate en las relaciones de asociación, que son líneas simples entre clases.
        Los tipos de datos deben ser válidos para Spring Boot.`;
      } else if (audioFile) {
        uploadedFile = await this.ai.files.upload({
          file: audioFile
        });
        mediaPrompt = `Analiza este audio y genera un diagrama UML de clases basado en lo que escuchas.`;
      }

      const prompt = `${mediaPrompt}
${additionalPrompt ? `Contexto adicional: ${additionalPrompt}` : ''}

Crea un objeto JSON con la estructura exacta indicada.
Genera al menos 8-20 clases con atributos, relaciones.
No incluyas métodos.
`;

      const requestBody: any = {
        model: "gemini-2.0-flash",
        contents: [],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema:getUMLDiagramSchema
        }
      };

      if (imageFile || audioFile) {
        requestBody.contents = [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                fileData: {
                  mimeType: uploadedFile!.mimeType,
                  fileUri: uploadedFile!.uri
                }
              }
            ]
          }
        ];
      } else {
        requestBody.contents = prompt;
      }

      const response = await this.ai.models.generateContent(requestBody);
      const diagram: UMLDiagram = JSON.parse(response.text || '{}');
      return diagram;
    } catch (error) {
      console.error('Error al generar diagrama desde archivo:', error);
      throw error;
    }
  }

  /**
   * Genera una respuesta de texto normal del chat
   */
  async generateTextResponse(userMessage: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Eres un asistente experto en diagramas UML de clases. Responde de manera clara y concisa. 
        Usuario: ${userMessage}`
      });

      return response.text || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('Error al generar respuesta de texto:', error);
      return 'Lo siento, hubo un error al procesar tu mensaje.';
    }
  }

  /**
   * Genera una clase individual que se relacione con clases existentes
   */
  async generateSingleClass(
    className: string,
    relatedClasses: string[],
    currentDiagram: UMLDiagram,
    additionalContext?: string
  ): Promise<{ newClass: any, newRelations: any[] }> {
    try {
      const existingClassesContext = currentDiagram.classes
        .filter(c => relatedClasses.includes(c.name))
        .map(c => `- ${c.name} (id: ${c.id}): ${c.attributes.map(a => `${a.name}:${a.type}`).join(', ')}`)
        .join('\n');

      const prompt = `Genera una clase UML llamada "${className}" que se relacione con las siguientes clases existentes:

${existingClassesContext}

${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Genera SOLO la nueva clase "${className}" con:
- Al menos 3-5 atributos relevantes (tipos válidos para Spring Boot: String, Integer, Long, Double, Boolean, LocalDate, LocalDateTime, BigDecimal)
- Relaciones apropiadas con las clases mencionadas

RETORNA EXACTAMENTE este formato JSON:
{
  "newClass": {
    "name": "${className}",
    "attributes": [
      { "name": "nombreAtributo", "type": "String", "visibility": "private" }
    ],
    "position": { "x": 400, "y": 300 }
  },
  "newRelations": [
    {
      "toClassName": "NombreDeLaClaseRelacionada",
      "type": "association",
      "label": "descripción de la relación",
      "multiplicity": { "from": "1", "to": "*" }
    }
  ]
}

IMPORTANTE: En newRelations usa "toClassName" con el NOMBRE de la clase (no el ID).`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      console.log('🤖 Respuesta raw de Gemini:', response.text);
      const result = JSON.parse(response.text || '{}');
      console.log('📋 Resultado parseado:', result);
      
      // Validar que tenga la estructura correcta
      if (!result.newClass || !result.newClass.name) {
        console.error('❌ La IA no generó el nombre de la clase correctamente');
        throw new Error('Respuesta de IA incompleta: falta el nombre de la clase');
      }

      return result;
    } catch (error) {
      console.error('Error al generar clase individual:', error);
      throw error;
    }
  }

  /**
   * ================== AGENTE MEJORADOR DE DIAGRAMAS ==================
   * Mejora un diagrama existente mediante un proceso de múltiples pasos
   */

  /**
   * Ejecuta el agente mejorador con pasos progresivos
   * @param currentDiagram - Diagrama actual a mejorar
   * @param contextPrompt - Contexto o instrucciones para la mejora
   * @param getUMLDiagramSchema - Schema para validar el diagrama mejorado
   * @returns Promise con el diagrama mejorado
   */
  async improveUMLDiagram(
    currentDiagram: UMLDiagram,
    contextPrompt: string,
    getUMLDiagramSchema: any
  ): Promise<UMLDiagram> {
    try {
      // Inicializar pasos del proceso
      const steps: ImprovementStep[] = [
        {
          step: 1,
          title: 'Análisis del diagrama actual',
          description: 'Analizando la estructura y relaciones actuales...',
          status: 'pending'
        },
        {
          step: 2,
          title: 'Generación de mejoras',
          description: 'Generando mejoras basadas en el contexto...',
          status: 'pending'
        },
        {
          step: 3,
          title: 'Validación y refinamiento',
          description: 'Validando coherencia y refinando el diagrama...',
          status: 'pending'
        },
        {
          step: 4,
          title: 'Aplicación de cambios',
          description: 'Aplicando los cambios finales...',
          status: 'pending'
        }
      ];

      // Emitir estado inicial
      this.emitProgress(steps, 0, 0);

      // PASO 1: Análisis del diagrama
      steps[0].status = 'processing';
      this.emitProgress(steps, 0, 20);

      const analysisResult = await this.analyzeCurrentDiagram(currentDiagram);
      steps[0].status = 'completed';
      steps[0].result = analysisResult;
      this.emitProgress(steps, 0, 25);

      // PASO 2: Generación de mejoras
      steps[1].status = 'processing';
      this.emitProgress(steps, 1, 30);

      const improvementSuggestions = await this.generateImprovementSuggestions(
        currentDiagram,
        analysisResult,
        contextPrompt
      );
      steps[1].status = 'completed';
      steps[1].result = improvementSuggestions;
      this.emitProgress(steps, 1, 50);

      // PASO 3: Validación y refinamiento
      steps[2].status = 'processing';
      this.emitProgress(steps, 2, 60);

      const refinementResult = await this.validateAndRefine(
        currentDiagram,
        improvementSuggestions
      );
      steps[2].status = 'completed';
      steps[2].result = refinementResult;
      this.emitProgress(steps, 2, 75);

      // PASO 4: Aplicación final
      steps[3].status = 'processing';
      this.emitProgress(steps, 3, 80);

      const improvedDiagram = await this.applyImprovements(
        currentDiagram,
        refinementResult,
        getUMLDiagramSchema
      );
      steps[3].status = 'completed';
      steps[3].result = '✅ Diagrama mejorado exitosamente';
      this.emitProgress(steps, 3, 100);

      return improvedDiagram;
    } catch (error) {
      console.error('Error en agente mejorador:', error);
      throw error;
    }
  }

  /**
   * Paso 1: Analiza el diagrama actual
   */
  private async analyzeCurrentDiagram(diagram: UMLDiagram): Promise<string> {
    const analysisPrompt = `Analiza brevemente este diagrama UML de clases (máximo 200 palabras):

Diagrama: ${JSON.stringify(diagram, null, 2)}

Identifica:
1. Número de clases y sus responsabilidades principales
2. Tipos de relaciones presentes
3. Posibles problemas o inconsistencias
4. Áreas que podrían mejorarse`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: analysisPrompt
      });
      return response.text || 'Análisis completado';
    } catch (error) {
      console.error('Error en análisis:', error);
      return 'Análisis completado con limitaciones';
    }
  }

  /**
   * Paso 2: Genera sugerencias de mejora
   */
  private async generateImprovementSuggestions(
    diagram: UMLDiagram,
    analysis: string,
    contextPrompt: string
  ): Promise<string> {
    const improvementPrompt = `Basándote en:

ANÁLISIS ACTUAL:
${analysis}

CONTEXTO PARA MEJORA:
${contextPrompt}

DIAGRAMA ACTUAL:
${JSON.stringify(diagram, null, 2)}

Genera sugerencias específicas para mejorar el diagrama (máximo 300 palabras):
- Clases que deberían agregarse
- Relaciones que deberían modificarse
- Atributos que falta agregar
- Cambios de estructura recomendados

Sé específico y pragmático.`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: improvementPrompt
      });
      return response.text || 'Sugerencias generadas';
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      return 'Sugerencias completadas con limitaciones';
    }
  }

  /**
   * Paso 3: Valida y refina las sugerencias
   */
  private async validateAndRefine(
    diagram: UMLDiagram,
    suggestions: string
  ): Promise<string> {
    const refinementPrompt = `Valida y refina estas sugerencias de mejora (máximo 250 palabras):

SUGERENCIAS:
${suggestions}

CONTEXTO DEL DIAGRAMA ACTUAL:
${JSON.stringify(diagram, null, 2)}

Responde:
1. ¿Son coherentes las sugerencias con el diagrama actual?
2. ¿Hay conflictos que deba resolver?
3. Prioriza las mejoras (alta, media, baja prioridad)
4. Cambios específicos a implementar (con nombres exactos de clases/atributos)`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: refinementPrompt
      });
      return response.text || 'Validación completada';
    } catch (error) {
      console.error('Error en validación:', error);
      return 'Validación completada con limitaciones';
    }
  }

  /**
   * Paso 4: Aplica las mejoras y retorna el diagrama mejorado
   */
  private async applyImprovements(
    currentDiagram: UMLDiagram,
    refinement: string,
    getUMLDiagramSchema: any
  ): Promise<UMLDiagram> {
    const improvementPrompt = `Basándote en estas mejoras validadas:

${refinement}

Y el diagrama actual:
${JSON.stringify(currentDiagram, null, 2)}

Genera el diagrama UML MEJORADO completo en formato JSON.
IMPORTANTE:
- Mantén la estructura y IDs existentes de clases que no cambien
- Agrega nuevas clases solo si es necesario según las sugerencias
- Mejora las relaciones existentes
- Agrega atributos/métodos que falten
- Asegúrate de que todos los IDs sean únicos
- Los tipos de datos deben ser válidos para Spring Boot`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: improvementPrompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: getUMLDiagramSchema
        }
      });

      const improvedDiagram: UMLDiagram = JSON.parse(response.text || '{}');
      return improvedDiagram;
    } catch (error) {
      console.error('Error aplicando mejoras:', error);
      throw error;
    }
  }

  /**
   * Emite el progreso del agente mejorador
   */
  private emitProgress(steps: ImprovementStep[], currentStep: number, progress: number): void {
    this.improvementProgressSubject.next({
      steps,
      currentStep,
      progress
    });
  }

  /**
   * Obtiene el observable de progreso
   */
  getImprovementProgress(): Observable<ImprovementProgress> {
    return this.improvementProgress$;
  }
}

