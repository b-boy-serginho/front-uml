import { UMLClass, UMLRelation, RelationType } from '../interfaces/uml-models';

/**
 * Interfaz que define el contrato para el componente UML Canvas
 * Documenta todas las funcionalidades disponibles para la creación y manipulación de diagramas UML
 */
export interface IUMLCanvasComponent {

  // ==================== PROPIEDADES PÚBLICAS ====================
  
  /** Lista de clases UML en el diagrama */
  classes: UMLClass[];
  
  /** Lista de relaciones entre clases */
  relations: UMLRelation[];
  
  /** Indica si el modo de creación de relaciones está activo */
  relationMode: boolean;
  
  /** Tipo de relación seleccionado para crear nuevas relaciones */
  selectedRelationType: RelationType;
  
  /** Mensaje de estado mostrado al usuario */
  statusMessage: string;
  
  /** ID de la clase actualmente seleccionada */
  selectedClass: string | null;
  
  /** ID de la relación actualmente seleccionada */
  selectedRelation: string | null;
  
  /** Indica si la leyenda de tipos de relación está visible */
  showLegend: boolean;
  
  /** Opciones predefinidas para multiplicidad en relaciones */
 

  // ==================== EVENTOS DEL CANVAS ====================

  /**
   * Maneja el doble clic en el canvas para crear una nueva clase
   * @param event - Evento del mouse que contiene las coordenadas
   */
  onCanvasDoubleClick(event: MouseEvent): void;

  /**
   * Maneja el clic en el canvas para deseleccionar elementos
   * @param event - Evento del mouse
   */
  onCanvasMouseDown(event: MouseEvent): void;

  /**
   * Maneja el movimiento del mouse para arrastrar clases
   * @param event - Evento del mouse con las coordenadas actuales
   */
  onCanvasMouseMove(event: MouseEvent): void;

  /**
   * Finaliza el arrastre de elementos al soltar el mouse
   * @param event - Evento del mouse
   */
  onCanvasMouseUp(event: MouseEvent): void;

  // ==================== EVENTOS DE CLASES ====================

  /**
   * Inicia el arrastre de una clase UML
   * @param event - Evento del mouse para obtener coordenadas iniciales
   * @param classId - ID único de la clase a arrastrar
   */
  onClassMouseDown(event: MouseEvent, classId: string): void;

  /**
   * Maneja el clic en una clase para selección o creación de relaciones
   * @param classId - ID único de la clase clickeada
   */
  onClassClick(classId: string): void;



  // ==================== GESTIÓN DE CLASES ====================

  /**
   * Crea una nueva clase UML en el diagrama
   * @param position - Posición opcional donde crear la clase. Si no se proporciona, se genera aleatoriamente
   */
  addNewClass(position?: { x: number; y: number }): void;

  /**
   * Actualiza el nombre de una clase existente
   * @param classId - ID único de la clase
   * @param newName - Nuevo nombre para la clase
   */
  updateClassName(classId: string, newName: string): void;

  // ==================== GESTIÓN DE ATRIBUTOS ====================

  /**
   * Añade un nuevo atributo a una clase
   * @param classId - ID único de la clase
   */
  onClassAddAttribute(classId: string): void;



  /**
   * Elimina un atributo de una clase
   * @param classId - ID único de la clase
   * @param attributeId - ID único del atributo a eliminar
   */
  deleteAttribute(classId: string, attributeId: string): void;

  // ==================== GESTIÓN DE MÉTODOS ====================







  // ==================== GESTIÓN DE RELACIONES ====================

  /**
   * Activa/desactiva el modo de creación de relaciones
   */
  toggleRelationMode(): void;

  /**
   * Selecciona una relación para mostrar sus propiedades
   * @param relationId - ID único de la relación
   */
  selectRelation(relationId: string): void;

  /**
   * Obtiene la relación actualmente seleccionada
   * @returns La relación seleccionada o null si no hay ninguna
   */
  getSelectedRelation(): UMLRelation | null;

  /**
   * Actualiza las propiedades de la relación seleccionada
   */
  updateSelectedRelation(): void;

  /**
   * Cierra el panel de propiedades de relación
   */
  closeRelationPanel(): void;

  /**
   * Establece la multiplicidad del origen de una relación
   * @param value - Valor de multiplicidad (ej: "1", "0..1", "1..*", "*")
   */
  setMultiplicityFrom(value: string): void;

  /**
   * Establece la multiplicidad del destino de una relación
   * @param value - Valor de multiplicidad (ej: "1", "0..1", "1..*", "*")
   */
  setMultiplicityTo(value: string): void;

  // ==================== CÁLCULOS GEOMÉTRICOS ====================

  /**
   * Calcula la coordenada X del punto de inicio de una relación
   * @param relation - Relación para calcular el punto
   * @returns Coordenada X del punto de inicio
   */
  getRelationStartX(relation: UMLRelation): number;

  /**
   * Calcula la coordenada Y del punto de inicio de una relación
   * @param relation - Relación para calcular el punto
   * @returns Coordenada Y del punto de inicio
   */
  getRelationStartY(relation: UMLRelation): number;

  /**
   * Calcula la coordenada X del punto final de una relación
   * @param relation - Relación para calcular el punto
   * @returns Coordenada X del punto final
   */
  getRelationEndX(relation: UMLRelation): number;

  /**
   * Calcula la coordenada Y del punto final de una relación
   * @param relation - Relación para calcular el punto
   * @returns Coordenada Y del punto final
   */
  getRelationEndY(relation: UMLRelation): number;

  /**
   * Calcula la coordenada X para mostrar la multiplicidad del origen
   * @param relation - Relación para calcular la posición
   * @returns Coordenada X para la multiplicidad del origen
   */
  getMultiplicityFromX(relation: UMLRelation): number;

  /**
   * Calcula la coordenada Y para mostrar la multiplicidad del origen
   * @param relation - Relación para calcular la posición
   * @returns Coordenada Y para la multiplicidad del origen
   */
  getMultiplicityFromY(relation: UMLRelation): number;

  /**
   * Calcula la coordenada X para mostrar la multiplicidad del destino
   * @param relation - Relación para calcular la posición
   * @returns Coordenada X para la multiplicidad del destino
   */
  getMultiplicityToX(relation: UMLRelation): number;

  /**
   * Calcula la coordenada Y para mostrar la multiplicidad del destino
   * @param relation - Relación para calcular la posición
   * @returns Coordenada Y para la multiplicidad del destino
   */
  getMultiplicityToY(relation: UMLRelation): number;

  /**
   * Calcula la coordenada X para mostrar la etiqueta de la relación
   * @param relation - Relación para calcular la posición
   * @returns Coordenada X para la etiqueta
   */
  getRelationLabelX(relation: UMLRelation): number;

  /**
   * Calcula la coordenada Y para mostrar la etiqueta de la relación
   * @param relation - Relación para calcular la posición
   * @returns Coordenada Y para la etiqueta
   */
  getRelationLabelY(relation: UMLRelation): number;

  // ==================== ESTILOS Y VISUALIZACIÓN ====================

  /**
   * Obtiene el color para un tipo específico de relación
   * @param type - Tipo de relación UML
   * @returns Color hexadecimal o nombre de color CSS
   */
  getRelationColor(type: RelationType): string;

  /**
   * Obtiene el patrón de línea punteada para un tipo de relación
   * @param type - Tipo de relación UML
   * @returns Patrón de línea SVG (ej: "8,4" para línea punteada)
   */
  getRelationDashArray(type: RelationType): string;

  /**
   * Obtiene el marcador (flecha, diamante) para el final de una relación
   * @param type - Tipo de relación UML
   * @returns URL del marcador SVG
   */
  getRelationMarker(type: RelationType): string;

  /**
   * Obtiene la descripción textual de un tipo de relación
   * @param type - Tipo de relación UML
   * @returns Descripción legible del tipo de relación
   */
  getRelationDescription(type: RelationType): string;

  /**
   * Obtiene el símbolo de visibilidad para atributos y métodos
   * @param visibility - Nivel de visibilidad ("public", "private", "protected", "package")
   * @returns Símbolo correspondiente (+, -, #, ~)
   */
  getVisibilitySymbol(visibility: string): string;

  // ==================== FUNCIONES DE UTILIDAD ====================

  /**
   * Función de seguimiento para atributos en *ngFor (optimización de rendimiento)
   * @param index - Índice del elemento en la lista
   * @param attr - Objeto atributo
   * @returns ID único del atributo
   */
  trackByAttributeId(index: number, attr: any): string;

  /**
   * Función de seguimiento para métodos en *ngFor (optimización de rendimiento)
   * @param index - Índice del elemento en la lista
   * @param method - Objeto método
   * @returns ID único del método
   */
  trackByMethodId(index: number, method: any): string;

  // ==================== GESTIÓN DEL TEMA ====================

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void;

  /**
   * Muestra/oculta la leyenda de tipos de relación
   */
  toggleLegend(): void;

  // ==================== OPERACIONES DEL DIAGRAMA ====================

  /**
   * Limpia completamente el diagrama (elimina todas las clases y relaciones)
   */
  clearCanvas(): void;

  /**
   * Exporta el diagrama actual a un archivo JSON
   */
  exportDiagram(): void;

  // ==================== EVENTOS DEL PANEL DE PROPIEDADES ====================

  /**
   * Maneja el cierre del panel de propiedades de relación
   */
  onRelationPanelClose(): void;

  /**
   * Maneja la actualización de una relación desde el panel de propiedades
   * @param relation - Relación actualizada
   */
  onRelationUpdate(relation: UMLRelation): void;

  /**
   * Maneja la eliminación de una relación desde el panel de propiedades
   * @param relationId - ID de la relación a eliminar
   */
  onRelationDelete(relationId: string): void;

  /**
   * Establece la multiplicidad del origen desde el panel de propiedades
   * @param value - Valor de multiplicidad seleccionado
   */
  onSetMultiplicityFrom(value: string): void;

  /**
   * Establece la multiplicidad del destino desde el panel de propiedades
   * @param value - Valor de multiplicidad seleccionado
   */
  onSetMultiplicityTo(value: string): void;
}