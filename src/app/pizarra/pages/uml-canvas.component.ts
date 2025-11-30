import { Component, OnInit, OnDestroy, HostListener, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UMLDiagramService } from '../services/uml-diagram.service';
import { ThemeService } from '../../share/services/theme.service';
import { GeometryCalculatorService } from '../services/geometry/geometry-calculator.service';
import { ChatService } from '../services/chat.service';
import { v4 as uuidv4 } from 'uuid';
import { DragManagerService } from '../services/drag-manager.service';
import { UMLClass, UMLRelation, VISIBILITY_SYMBOLS, RelationType, UMLDiagram } from '../interfaces/uml-models';
import { IUMLCanvasComponent } from '../interfaces/IUMLCanvasComponent';
import { Subscription } from 'rxjs';
import { RelationPropertyPanelComponent } from '../components/modal_relaciones/relation-property-panel.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { ImproveAgentModalComponent } from '../components/improve-agent-modal/improve-agent-modal.component';
import { ExportImportModalComponent } from '../components/export-import-modal/export-import-modal.component';
import { RelationStyleService } from '../services/relation-style.service';
import { SocketService, SocketUser } from '../services/socket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PizarraService } from '../services/pizarra.service';
import { CodeViewerComponent } from '../components/code-viewer/code-viewer.component';
import { ZipViewerService } from '../services/zip-viewer.service';

@Component({
  selector: 'app-uml-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RelationPropertyPanelComponent,
    SidebarComponent,
    ImproveAgentModalComponent,
    ExportImportModalComponent,
    CodeViewerComponent
  ],
  templateUrl: './uml-canvas.component.html',
  styleUrls: ['./uml-canvas.component.css']
})
export class UMLCanvasComponent implements OnInit, OnDestroy, IUMLCanvasComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  private subscription!: Subscription;
  classes: UMLClass[] = [];
  relations: UMLRelation[] = [];
  relationMode = false;
  selectedRelationType: RelationType = 'association';
  statusMessage = '';
  selectedClass: string | null = null;
  selectedRelation: string | null = null;
  showLegend = false;
  showImproveAgent = false;
  showExportImportModal = false;
  private selectedClassForRelation: string | null = null;

  // Dimensiones dinámicas del SVG
  svgWidth = 1200;
  svgHeight = 800;

  // Code viewer
  showCodeViewer = false;
  lastZipBlob: Blob | null = null;

  // Socket properties
  connectedUsers: SocketUser[] = [];
  currentUser: SocketUser | null = null;
  isSocketConnected = false;
  roomId: string = '';



  public diagramService = inject(UMLDiagramService);
  public themeService = inject(ThemeService);
  public zipViewer = inject(ZipViewerService);
  private geometryCalculator = inject(GeometryCalculatorService);
  private dragManager = inject(DragManagerService);
  public relationStyleService = inject(RelationStyleService);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService);

  private pizarraService = inject(PizarraService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    console.log('🎨 Iniciando UML Canvas Component');
    // Limpiar el diagrama primero para empezar con un canvas limpio
    this.diagramService.clearDiagram();
    
    this.subscription = this.diagramService.diagram$.subscribe(diagram => {
      this.classes = diagram.classes;
      this.relations = diagram.relations;
      console.log('📊 Diagrama actualizado:', { classes: this.classes.length, relations: this.relations.length });
      this.updateSVGDimensions();
      
      // Actualizar el diagrama en el chat service para contexto de IA
      this.chatService.setCurrentDiagram(diagram);
    });

    // Suscribirse a clases individuales generadas por IA
    this.chatService.singleClassGenerated$.subscribe(result => {
      this.onSingleClassGenerated(result);
    });

    // Inicializar sockets
    this.initializeSocket();
    this.setupSocketListeners();
  }

  /**
   * Calcula y actualiza el tamaño dinámico del SVG basado en las posiciones de las clases
   */
  private updateSVGDimensions(): void {
    if (this.classes.length === 0) {
      this.svgWidth = 1200;
      this.svgHeight = 800;
      return;
    }

    // Encontrar los límites del diagrama
    let maxX = 1200;
    let maxY = 800;

    this.classes.forEach(cls => {
      // Sumar el ancho aproximado de una clase (200px) y altura (150px) + padding
      const classWidth = 200;
      const classHeight = 150;
      const rightEdge = cls.position.x + classWidth + 50;
      const bottomEdge = cls.position.y + classHeight + 50;

      if (rightEdge > maxX) maxX = rightEdge;
      if (bottomEdge > maxY) maxY = bottomEdge;
    });

    // Asegurar dimensiones mínimas
    this.svgWidth = Math.max(1200, maxX);
    this.svgHeight = Math.max(800, maxY);
  }

  get isSidebarExpanded(): boolean {
    return this.sidebar?.isExpanded || false;
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.socketService.disconnect();
  }
  onSidebarItemSelected(itemId: string): void {
    console.log('Sidebar item selected:', itemId);
    this.showLegend = false;
    switch (itemId) {
      case 'legend':
        this.showLegend = true;
        break;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    if (this.dragManager.isDragging()) {
      const draggedClassId = this.dragManager.endDrag();

      // Actualizar dimensiones del SVG después de mover
      this.updateSVGDimensions();

      // Si se estaba arrastrando una clase, emitir evento de socket
      if (draggedClassId && this.isSocketConnected) {
        const draggedClass = this.classes.find(c => c.id === draggedClassId);
        if (draggedClass) {
          this.socketService.emitClassUpdated(draggedClass);
        }
      }
    }
  }
  onCanvasDoubleClick(event: MouseEvent): void {
    if (!this.relationMode && event.target === event.currentTarget) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      this.addNewClass(position);
    }
  }
  onCanvasMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.selectedClass = null;
      this.selectedRelation = null;
    }
  }
  onCanvasMouseMove(event: MouseEvent): void {
    this.dragManager.handleDragMove(event);
  }
  onCanvasMouseUp(event: MouseEvent): void {
    const draggedClassId = this.dragManager.endDrag();

    // Actualizar dimensiones del SVG después de mover
    this.updateSVGDimensions();

    // Si se estaba arrastrando una clase, emitir evento de socket
    if (draggedClassId && this.isSocketConnected) {
      const draggedClass = this.classes.find(c => c.id === draggedClassId);
      if (draggedClass) {
        this.socketService.emitClassUpdated(draggedClass);
      }
    }
  }

  onClassMouseDown(event: MouseEvent, classId: string): void {
    this.dragManager.startDrag(event, classId);
  }
  onClassClick(classId: string): void {
    if (this.relationMode) {
      this.handleClassClickForRelation(classId);
    } else {
      this.selectedClass = classId;
    }
  }
  addNewClass(position?: { x: number; y: number }): void {
    const pos = position || {
      x: Math.random() * 800 + 100,
      y: Math.random() * 400 + 100
    };

    const newClass = this.diagramService.addClass(pos);

    // Actualizar dimensiones del SVG
    this.updateSVGDimensions();

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      this.socketService.emitClassAdded(newClass);
    }

    this.statusMessage = `Nueva clase creada: ${newClass.name}`;
    setTimeout(() => this.statusMessage = '', 3000);
  }
  toggleRelationMode(): void {
    this.relationMode = !this.relationMode;
    this.selectedClassForRelation = null;
    this.statusMessage = this.relationMode ?
      'Modo relación activado. Haz clic en dos clases para conectarlas.' :
      'Modo relación desactivado.';
    setTimeout(() => this.statusMessage = '', 3000);
  }
  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.statusMessage = `Tema ${this.themeService.isDarkTheme() ? 'oscuro' : 'claro'} activado`;
    setTimeout(() => this.statusMessage = '', 2000);
  }
  private handleClassClickForRelation(classId: string): void {
    if (!this.selectedClassForRelation) {
      this.selectedClassForRelation = classId;
      this.statusMessage = 'Primera clase seleccionada. Haz clic en otra clase (o la misma) para crear la relación.';
    } else {
      // Permitir relaciones a la misma clase (auto-relaciones)
      const newRelation = this.diagramService.addRelation({
        fromClassId: this.selectedClassForRelation,
        toClassId: classId,
        type: this.selectedRelationType,
        label: '',
        multiplicity: { from: '', to: '' }
      });

      // Emitir evento de socket si está conectado
      if (this.isSocketConnected && newRelation) {
        this.socketService.emitRelationAdded(newRelation);
      }

      this.selectedClassForRelation = null;
      this.relationMode = false;
      if (this.selectedClassForRelation === classId) {
        this.statusMessage = 'Relación reflexiva creada exitosamente.';
      } else {
        this.statusMessage = 'Relación creada exitosamente.';
      }
    }
    setTimeout(() => this.statusMessage = '', 3000);
  }
  clearCanvas(): void {
    if (confirm('¿Estás seguro de que quieres limpiar todo el diagrama?')) {
      this.diagramService.clearDiagram();
      this.statusMessage = 'Diagrama limpiado.';
      setTimeout(() => this.statusMessage = '', 3000);
    }
  }
  exportDiagram(): void {
    const diagramJson = this.diagramService.exportDiagram();
    const blob = new Blob([diagramJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagrama-uml.json';
    a.click();
    window.URL.revokeObjectURL(url);

    this.statusMessage = 'Diagrama exportado exitosamente.';
    setTimeout(() => this.statusMessage = '', 3000);
  }
  // Métodos auxiliares para relaciones
  getRelationStartX(relation: UMLRelation): number {
    const connection = this.geometryCalculator.calculateConnectionPoints(relation, this.classes);
    return connection.start.x;
  }
  getRelationStartY(relation: UMLRelation): number {
    const connection = this.geometryCalculator.calculateConnectionPoints(relation, this.classes);
    return connection.start.y;
  }
  getRelationEndX(relation: UMLRelation): number {
    const connection = this.geometryCalculator.calculateConnectionPoints(relation, this.classes);
    return connection.end.x;
  }
  getRelationEndY(relation: UMLRelation): number {
    const connection = this.geometryCalculator.calculateConnectionPoints(relation, this.classes);
    return connection.end.y;
  }
  getRelationColor(type: RelationType): string {
    return this.relationStyleService.getRelationColor(type);
  }
  getRelationDashArray(type: RelationType): string {
    return this.relationStyleService.getRelationDashArray(type);
  }
  getRelationMarker(type: RelationType): string {
    return this.relationStyleService.getRelationMarker(type);
  }
  selectRelation(relationId: string): void {
    this.selectedRelation = relationId;
    this.selectedClass = null;
    // Asegurar que la relación tenga multiplicidad inicializada
    const relation = this.relations.find(r => r.id === relationId);
    if (relation && !relation.multiplicity) {
      relation.multiplicity = { from: '', to: '' };
    }
  }
  getSelectedRelation(): UMLRelation | null {
    return this.relations.find(r => r.id === this.selectedRelation) || null;
  }
  updateSelectedRelation(): void {
    const relation = this.getSelectedRelation();
    console.log("es la relacion correcta aseccion:", relation);
    if (relation) {
      this.diagramService.updateRelation(relation.id, {
        type: relation.type,
        label: relation.label,
        multiplicity: relation.multiplicity
      });
      if (this.isSocketConnected) {
        this.socketService.emitRelationUpdated(relation);
      }
    }
  }
  closeRelationPanel(): void {
    this.selectedRelation = null;
  }
  setMultiplicityFrom(value: string): void {
    const relation = this.getSelectedRelation();
    if (relation && relation.multiplicity) {
      relation.multiplicity.from = value;
      this.updateSelectedRelation();
      if (this.isSocketConnected) {
        this.socketService.emitRelationUpdated(relation);
      }
    }
  }
  setMultiplicityTo(value: string): void {
    const relation = this.getSelectedRelation();
    if (relation && relation.multiplicity) {
      relation.multiplicity.to = value;
      this.updateSelectedRelation();
      if (this.isSocketConnected) {
        this.socketService.emitRelationUpdated(relation);
      }
    }
  }
  getMultiplicityFromX(relation: UMLRelation): number {
    const position = this.geometryCalculator.getMultiplicityFromPosition(relation, this.classes);
    return position.x;
  }
  getMultiplicityFromY(relation: UMLRelation): number {
    const position = this.geometryCalculator.getMultiplicityFromPosition(relation, this.classes);
    return position.y;
  }
  getMultiplicityToX(relation: UMLRelation): number {
    const position = this.geometryCalculator.getMultiplicityToPosition(relation, this.classes);
    return position.x;
  }
  getMultiplicityToY(relation: UMLRelation): number {
    const position = this.geometryCalculator.getMultiplicityToPosition(relation, this.classes);
    return position.y;
  }
  getRelationLabelX(relation: UMLRelation): number {
    const position = this.geometryCalculator.getRelationLabelPosition(relation, this.classes);
    return position.x;
  }
  getRelationLabelY(relation: UMLRelation): number {
    const position = this.geometryCalculator.getRelationLabelPosition(relation, this.classes);
    return position.y;
  }
  getVisibilitySymbol(visibility: string): string { return VISIBILITY_SYMBOLS[visibility as keyof typeof VISIBILITY_SYMBOLS] || '+'; }
  // TrackBy functions for performance
  trackByAttributeId(index: number, attr: any): string { return attr.id; }
  trackByMethodId(index: number, method: any): string { return method.id; }
  getRelationDescription(type: RelationType): string {
    return this.relationStyleService.getRelationDescription(type);
  }
  toggleLegend(): void {
    this.showLegend = !this.showLegend;
  }
  // Métodos para el nuevo componente RelationPropertyPanel
  onRelationPanelClose(): void {
    this.closeRelationPanel();
  }
  onRelationUpdate(relation: UMLRelation): void {
    this.updateSelectedRelation();
  }
  onRelationDelete(relationId: string): void {
    this.diagramService.deleteRelation(relationId);

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      this.socketService.emitRelationDeleted(relationId);
    }

    this.selectedRelation = null;
    this.statusMessage = 'Relación eliminada.';
    setTimeout(() => this.statusMessage = '', 3000);
  }
  onSetMultiplicityFrom(value: string): void {
    this.setMultiplicityFrom(value);
  }
  onSetMultiplicityTo(value: string): void {
    this.setMultiplicityTo(value);
  }
  // Métodos para clase de asociación
  createAssociationClassForRelation(relationId: string){
    const associationClass = this.diagramService.createAssociationClass(relationId);
    if (associationClass) {
      this.statusMessage = `Clase de asociación creada para la relación`;

      // Emitir eventos de socket si está conectado
      if (this.isSocketConnected) {
        // Emitir la nueva clase de asociación
        this.socketService.emitClassAdded(associationClass);

        // Emitir la relación actualizada con la clase de asociación
        const relation = this.relations.find(r => r.id === relationId);
        if (relation) {
          this.socketService.emitRelationUpdated(relation);
        }
      }

      setTimeout(() => this.statusMessage = '', 3000);
      return  associationClass.id;
    }
    return null;
  }
  getAssociationClassConnectionStart(relation: UMLRelation): { x: number; y: number } | null {
    if (!relation.associationClassId) return null;
    const associationClass = this.classes.find(c => c.id === relation.associationClassId);
    if (!associationClass) return null;
    const connection = this.geometryCalculator.calculateAssociationClassConnection(
      relation,
      associationClass,
      this.classes
    );
    return connection.relationMidpoint;
  }
  getAssociationClassConnectionEnd(relation: UMLRelation): { x: number; y: number } | null {
    if (!relation.associationClassId) return null;
    const associationClass = this.classes.find(c => c.id === relation.associationClassId);
    if (!associationClass) return null;
    const connection = this.geometryCalculator.calculateAssociationClassConnection(
      relation,
      associationClass,
      this.classes
    );
    return connection.classConnection;
  }
  hasAssociationClass(relation: UMLRelation): boolean { return !!relation.associationClassId; }
  removeAssociationClassFromRelation(relationId: string): void {
    const relation = this.relations.find(r => r.id === relationId);
    const associationClassId = relation?.associationClassId;

    this.diagramService.removeAssociationClass(relationId);

    // Emitir eventos de socket si está conectado
    if (this.isSocketConnected) {
      // Si había una clase de asociación, emitir su eliminación
      if (associationClassId) {
        this.socketService.emitClassDeleted(associationClassId);
      }

      // Emitir la relación actualizada (sin clase de asociación)
      const updatedRelation = this.relations.find(r => r.id === relationId);
      if (updatedRelation) {
        this.socketService.emitRelationUpdated(updatedRelation);
      }
    }

    this.statusMessage = 'Clase de asociación eliminada';
    setTimeout(() => this.statusMessage = '', 3000);
  }

  // Métodos para auto-relaciones
  isSelfRelation(relation: UMLRelation): boolean {
    return relation.fromClassId === relation.toClassId;
  }
  getSelfRelationPath(relation: UMLRelation): string {
    const startX = this.getRelationStartX(relation);
    const startY = this.getRelationStartY(relation);
    const endX = this.getRelationEndX(relation);
    const endY = this.getRelationEndY(relation);
    // Tamaño del bucle - mucho más grande para que salga claramente de la clase
    const loopWidth = 60;  // Distancia horizontal del bucle
    const loopHeight = 50; // Altura del bucle
    // Puntos de control para crear un bucle suave que sale hacia la derecha
    const control1X = startX + loopWidth;
    const control1Y = startY - loopHeight;
    const control2X = endX + loopWidth;
    const control2Y = endY + loopHeight;
    // Crear un path SVG para el bucle usando curvas Bézier cúbicas
    return `M ${startX} ${startY} 
            C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
  }
  deleteAttribute(classId: string, attributeId: string): void { this.diagramService.deleteAttribute(classId, attributeId); }
  updateClassName(classId: string, newName: string): void {
    this.diagramService.updateClass(classId, { name: newName });

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }
  onClassAddAttribute(classId: string): void {
    this.diagramService.addAttribute(classId);

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }

  onClassUpdateAttribute(data: { classId: string, attributeId: string }): void {
    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === data.classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }

  onClassDeleteAttribute(data: { classId: string, attributeId: string }): void {
    this.deleteAttribute(data.classId, data.attributeId);

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === data.classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }

  onClassAddMethod(classId: string): void {
    this.diagramService.addMethod(classId);

    // Emitir evento de socket si está conectado
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }

  onClassUpdateMethod(data: { classId: string, methodId: string }): void {
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === data.classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }

  onClassDeleteMethod(data: { classId: string, methodId: string }): void {
    this.diagramService.deleteMethod(data.classId, data.methodId);
    if (this.isSocketConnected) {
      const updatedClass = this.classes.find(c => c.id === data.classId);
      if (updatedClass) {
        this.socketService.emitClassUpdated(updatedClass);
      }
    }
  }
  onClassUpdateClassName(data: { classId: string, newName: string }): void {
    this.updateClassName(data.classId, data.newName);
  }
  onClassSelect(classId: string): void { this.selectedClass = classId; }
  getSelectedClassForPanel(): UMLClass | null { return this.classes.find(c => c.id === this.selectedClass) || null; }

  // Manejar diagrama generado desde el chat
  onDiagramGenerated(diagram: UMLDiagram): void {
    console.log('Canvas recibió diagrama generado:', diagram);

    var clasesAsocionadas: UMLClass[] = [];

    // Mapa para traducir IDs antiguos (de Gemini) a IDs nuevos (del servicio)
    const idMap = new Map<string, string>();

    // Crear las clases y mapear los IDs
    diagram.classes.forEach((cls, index) => {
      // Si no tiene posición o está en (0,0), generar una posición visible


      if (!cls.position || (cls.position.x === 0 && cls.position.y === 0)) {
        cls.position = {
          x: 150 + (index % 3) * 250, // Distribuir en columnas
          y: 150 + Math.floor(index / 3) * 200  // Distribuir en filas
        };
      }

      var nuevaClase: UMLClass;
      // Crear la nueva clase
      if (cls.stereotype === '<<association>>') {
        clasesAsocionadas.push(cls);
      }
      else {
        nuevaClase = this.diagramService.addClass({ x: cls.position.x, y: cls.position.y });
         // Mapear el ID antiguo al nuevo
        idMap.set(cls.id, nuevaClase!.id);
        // Actualizar con los datos de la clase
        this.diagramService.updateClass(nuevaClase!.id, {
          name: cls.name,
          attributes: cls.attributes,
          methods: cls.methods || [],
          isAbstract: cls.isAbstract,
          isInterface: cls.isInterface,
          stereotype: cls.stereotype
        });
      }
     

      

    });

    // Crear las relaciones usando los nuevos IDs
    diagram.relations.forEach((rel) => {
      const newFromId = idMap.get(rel.fromClassId);
      const newToId = idMap.get(rel.toClassId);

      // Solo crear la relación si ambos IDs existen en el mapa
      if (newFromId && newToId) {
        var relacion = this.diagramService.addRelation({
          fromClassId: newFromId,
          toClassId: newToId,
          type: rel.type,
          label: rel.label,
          multiplicity: rel.multiplicity
            
        });

         console.log("es la relacion correcta aseccion:", relacion);
         console.log(rel.associationClassId , "es associationClass");
        if (rel.associationClassId && clasesAsocionadas.length > 0) {
          console.log("entro a crear clase de asociacion");
          for (let claseAsociacion of clasesAsocionadas) {
            console.log("comparando ids:", claseAsociacion.id, rel.id);
            if (claseAsociacion.id === rel.associationClassId) {
              var nuevaAsociacionid = this.createAssociationClassForRelation(relacion.id);
              console.log("nuevaclaseAsociacion:", nuevaAsociacionid); 
              this.diagramService.updateClass(nuevaAsociacionid!, {
                name: claseAsociacion.name,
                attributes: claseAsociacion.attributes,
                methods: claseAsociacion.methods || [],
                isAbstract: claseAsociacion.isAbstract,
                isInterface: claseAsociacion.isInterface,
                stereotype: claseAsociacion.stereotype
              });
            }
          }
        }

      } else {
        console.warn('No se pudo crear la relación, IDs no encontrados:', {
          oldFrom: rel.fromClassId,
          oldTo: rel.toClassId,
          newFrom: newFromId,
          newTo: newToId
        });
      }
    });

    this.statusMessage = `✅ Diagrama "${diagram.name}" generado por IA con ${diagram.classes.length} clases y ${diagram.relations.length} relaciones`;
    setTimeout(() => this.statusMessage = '', 5000);

    // Opcional: Emitir por socket si estás en modo colaborativo
    if (this.isSocketConnected) {
      this.classes.forEach(cls => {
        this.socketService.emitClassAdded(cls);
      });
      this.relations.forEach(rel => {
        this.socketService.emitRelationAdded(rel);
      });
    }
  }

  // Manejar clase individual generada desde el chat
  onSingleClassGenerated(result: { newClass: any, newRelations: any[] }): void {
    console.log('🎨 Canvas recibió clase individual:', result);
    console.log('📦 newClass completo:', JSON.stringify(result.newClass, null, 2));
    console.log('🔗 newRelations:', JSON.stringify(result.newRelations, null, 2));

    if (!result || !result.newClass) {
      console.error('Clase individual inválida recibida:', result);
      return;
    }

    const { newClass, newRelations } = result;
    
    console.log('✏️ Nombre de la clase a crear:', newClass.name);

    // Crear la nueva clase en el diagrama
    const createdClass = this.diagramService.addClass(
      newClass.name || 'ClaseSinNombre'
    );
    
    console.log('✅ Clase creada con ID:', createdClass.id, 'y nombre:', createdClass.name);
    
    // Actualizar la posición si está especificada
    if (newClass.position) {
      this.diagramService.updateClass(createdClass.id, {
        position: newClass.position
      });
    }

    // Actualizar atributos si los tiene
    if (newClass.attributes && Array.isArray(newClass.attributes)) {
      this.diagramService.updateClass(createdClass.id, {
        attributes: newClass.attributes.map((attr: any) => ({
          id: uuidv4(),
          name: attr.name || 'attribute',
          type: attr.type || 'String',
          visibility: attr.visibility || 'private'
        }))
      });
    }

    // Crear las relaciones si existen
    if (newRelations && Array.isArray(newRelations)) {
      console.log('🔗 Procesando relaciones:', newRelations);
      console.log('📋 Clases disponibles:', this.classes.map(c => c.name));
      
      newRelations.forEach((rel: any) => {
        console.log('🔍 Buscando clase para relación:', rel);
        
        // Buscar las clases por nombre en el diagrama actual
        const toClass = this.classes.find(c => {
          const classNameMatch = c.name.toLowerCase() === rel.toClassName?.toLowerCase();
          const idMatch = c.id === rel.toClassId;
          console.log(`  Comparando ${c.name} con ${rel.toClassName}: ${classNameMatch}`);
          return classNameMatch || idMatch;
        });

        if (toClass) {
          console.log('✅ Clase encontrada:', toClass.name, '- Creando relación');
          this.diagramService.addRelation({
            fromClassId: createdClass.id,
            toClassId: toClass.id,
            type: rel.type || 'association',
            label: rel.label || '',
            multiplicity: rel.multiplicity || { from: '1', to: '*' }
          });
        } else {
          console.warn('❌ Clase destino no encontrada para relación:', rel);
          console.warn('  Clases disponibles:', this.classes.map(c => ({ id: c.id, name: c.name })));
        }
      });
    } else {
      console.log('⚠️ No se recibieron relaciones o no es un array:', newRelations);
    }

    this.statusMessage = `✅ Clase "${newClass.name}" agregada por IA`;
    setTimeout(() => this.statusMessage = '', 3000);

    // Emitir por socket si está conectado
    if (this.isSocketConnected) {
      this.socketService.emitClassAdded(createdClass);
    }
  }

  // Métodos para Socket.IO
  private initializeSocket(): void {
    this.route.params.subscribe(params => {
      this.roomId = params['roomId'] || params['id'] || SocketService.getRoomIdFromRoute();
      this.currentUser = SocketService.generateRandomUser();
      this.socketService.connect(this.roomId, this.currentUser);
      console.log(`Conectando a sala colaborativa: ${this.roomId}`);
    });
  }

  private setupSocketListeners(): void {
    this.socketService.isConnected().subscribe(connected => {
      this.isSocketConnected = connected;
      if (connected) {
        this.statusMessage = 'Conectado a sala colaborativa';
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });
    this.socketService.getUsers().subscribe(users => {
      this.connectedUsers = users;
    });

    // Escuchar el estado inicial del diagrama
    this.socketService.onDiagramState().subscribe(state => {
      console.log('Estado del diagrama recibido en componente:', state);
      if (state && (state.classes.length > 0 || state.relations.length > 0)) {
        this.diagramService.loadDiagramState(state.classes, state.relations);
        this.statusMessage = `Diagrama sincronizado: ${state.classes.length} clases, ${state.relations.length} relaciones`;
        setTimeout(() => this.statusMessage = '', 3000);
      }
    });

    // Eventos de clases
    this.socketService.onClassAdded().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        const newClass = this.diagramService.addClass(event.data.position);
        this.diagramService.updateClass(newClass.id, event.data);
        this.statusMessage = `${event.user.name} agregó una clase`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });

    this.socketService.onClassUpdated().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        this.diagramService.updateClass(event.data.id, event.data);
        this.statusMessage = `${event.user.name} modificó una clase`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });

    this.socketService.onClassDeleted().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        this.diagramService.deleteClass(event.data.classId);
        this.statusMessage = `${event.user.name} eliminó una clase`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });

    // Eventos de relaciones
    this.socketService.onRelationAdded().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        this.diagramService.addRelation(event.data, event.data.id);
        this.statusMessage = `${event.user.name} agregó una relación`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });

    this.socketService.onRelationUpdated().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        this.diagramService.updateRelation(event.data.id, event.data);
        this.statusMessage = `${event.user.name} modificó una relación`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });

    this.socketService.onRelationDeleted().subscribe(event => {
      if (event.user.id !== this.currentUser?.id) {
        this.diagramService.deleteRelation(event.data.relationId);
        this.statusMessage = `${event.user.name} eliminó una relación`;
        setTimeout(() => this.statusMessage = '', 2000);
      }
    });
  }

  // Manejar movimiento del cursor para colaboración
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isSocketConnected && this.currentUser) {
      // Throttle para no enviar demasiados eventos
      if (!this.lastCursorEmit || Date.now() - this.lastCursorEmit > 50) {
        this.socketService.emitCursorMove(event.clientX, event.clientY);
        this.lastCursorEmit = Date.now();
      }
    }
  }
  private lastCursorEmit: number = 0;


 // ...existing code...
exportDiagramSpringBoot(): void {
    const diagramJson = this.diagramService.getDiagram();

    this.pizarraService.exportSpringBoot(diagramJson,"ecommerce","com.ejemplo").subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/zip' });

        // Cargar en el visor de código (JSZip + Monaco)
        try {
          this.zipViewer.loadZip(blob);
          this.lastZipBlob = blob;
          this.showCodeViewer = true;
        } catch (e) {
          console.warn('No se pudo cargar el ZIP en el visor:', e);
        }

        // También ofrecer descarga como antes
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagrama-uml-springboot.zip';
        a.click();
        window.URL.revokeObjectURL(url);
        this.statusMessage = 'Diagrama exportado como proyecto Spring Boot exitosamente.';
        setTimeout(() => this.statusMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al exportar el diagrama como proyecto Spring Boot:', error);
        this.statusMessage = 'Error al exportar el diagrama como proyecto Spring Boot.';
        setTimeout(() => this.statusMessage = '', 3000);
      }
    });
  }
// ...existing code...


  deleteSelectedClass(): void {
    if (!this.selectedClass) {
      return;
    }

    const classToDelete = this.classes.find(c => c.id === this.selectedClass);
    const className = classToDelete?.name || 'la clase';

    if (confirm(`¿Estás seguro de que quieres eliminar ${className}?`)) {
      this.diagramService.deleteClass(this.selectedClass);

      // Emitir evento de socket si está conectado
      if (this.isSocketConnected) {
        this.socketService.emitClassDeleted(this.selectedClass);
      }

      this.statusMessage = `Clase "${className}" eliminada (y sus relaciones asociadas).`;
      this.selectedClass = null;
      setTimeout(() => this.statusMessage = '', 3000);
    }
  }

  /**
   * Ordena y ajusta automáticamente las clases en el canvas
   * Usa todo el espacio disponible de la pizarra
   */
  autoArrangeClasses(): void {
    if (this.classes.length === 0) {
      this.statusMessage = 'No hay clases para ordenar';
      setTimeout(() => this.statusMessage = '', 2000);
      return;
    }

    // Obtener dimensiones del viewport del canvas
    const canvasElement = document.querySelector('.canvas-area') as HTMLElement;
    if (!canvasElement) {
      this.statusMessage = 'Error: No se pudo obtener el área del canvas';
      setTimeout(() => this.statusMessage = '', 2000);
      return;
    }

    const canvasRect = canvasElement.getBoundingClientRect();
    const availableWidth = canvasRect.width - 100; // Margen de 50px a cada lado
    const availableHeight = canvasRect.height - 100; // Margen de 50px arriba y abajo

    // Configuración del layout
    const classWidth = 220; // Ancho aproximado de una clase
    const classHeight = 180; // Altura aproximada de una clase
    const padding = 40; // Espacio entre clases
    const margin = 50; // Margen desde los bordes

    // Calcular número de columnas y filas basado en el espacio disponible
    const numClasses = this.classes.length;
    const cols = Math.max(1, Math.floor(availableWidth / (classWidth + padding)));
    const rows = Math.max(1, Math.ceil(numClasses / cols));

    // Ajustar el espaciado para usar todo el ancho disponible
    const totalWidthNeeded = cols * classWidth + (cols - 1) * padding;
    const totalHeightNeeded = rows * classHeight + (rows - 1) * padding;
    
    // Calcular el espaciado horizontal y vertical para centrar y distribuir
    const horizontalSpacing = cols > 1 ? (availableWidth - totalWidthNeeded) / (cols - 1) : 0;
    const verticalSpacing = rows > 1 ? (availableHeight - totalHeightNeeded) / (rows - 1) : 0;
    
    const cellWidth = classWidth + padding + horizontalSpacing;
    const cellHeight = classHeight + padding + verticalSpacing;

    // Centrar el layout
    const startX = margin + (availableWidth - (cols * classWidth + (cols - 1) * (padding + horizontalSpacing))) / 2;
    const startY = margin + (availableHeight - (rows * classHeight + (rows - 1) * (padding + verticalSpacing))) / 2;

    // Crear un mapa de relaciones para optimizar el layout
    const relationMap = new Map<string, Set<string>>();
    this.relations.forEach(rel => {
      if (!relationMap.has(rel.fromClassId)) {
        relationMap.set(rel.fromClassId, new Set());
      }
      if (!relationMap.has(rel.toClassId)) {
        relationMap.set(rel.toClassId, new Set());
      }
      relationMap.get(rel.fromClassId)!.add(rel.toClassId);
      relationMap.get(rel.toClassId)!.add(rel.fromClassId);
    });

    // Calcular posiciones usando algoritmo mejorado
    const positionMap = this.calculateOptimalPositions(
      this.classes,
      relationMap,
      cols,
      rows,
      cellWidth,
      cellHeight,
      startX,
      startY
    );

    // Aplicar las nuevas posiciones usando el mapa
    positionMap.forEach((pos, classId) => {
      this.diagramService.updateClass(classId, { position: pos });

      // Emitir evento de socket si está conectado
      if (this.isSocketConnected) {
        const updatedClass = this.classes.find(c => c.id === classId);
        if (updatedClass) {
          this.socketService.emitClassUpdated(updatedClass);
        }
      }
    });

    // Actualizar dimensiones del SVG para que incluya todas las clases
    this.updateSVGDimensions();

    this.statusMessage = `✅ ${numClasses} clases ordenadas y ajustadas a la pantalla`;
    setTimeout(() => this.statusMessage = '', 3000);
  }

  /**
   * Calcula posiciones óptimas para las clases basándose en sus relaciones
   * Intenta colocar clases relacionadas cerca unas de otras
   * Retorna un Map con classId -> posición
   */
  private calculateOptimalPositions(
    classes: UMLClass[],
    relationMap: Map<string, Set<string>>,
    cols: number,
    rows: number,
    cellWidth: number,
    cellHeight: number,
    startX: number,
    startY: number
  ): Map<string, { x: number; y: number }> {
    const positionMap = new Map<string, { x: number; y: number }>();
    const usedPositions = new Set<string>();

    // Layout simple en cuadrícula para distribuir uniformemente
    classes.forEach((cls, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positionMap.set(cls.id, {
        x: startX + col * cellWidth,
        y: startY + row * cellHeight
      });
    });

    // Si hay relaciones, intentar optimizar posiciones
    if (relationMap.size > 0 && classes.length > 4) {
      // Intentar reorganizar clases relacionadas para que estén más cerca
      const sortedClasses = [...classes].sort((a, b) => {
        const aConnections = relationMap.get(a.id)?.size || 0;
        const bConnections = relationMap.get(b.id)?.size || 0;
        return bConnections - aConnections;
      });

      // Reorganizar posiciones para clases con más relaciones
      const newPositions = new Map<string, { x: number; y: number }>();
      const placed = new Set<string>();
      let currentIndex = 0;

      // Colocar primero las clases con más relaciones
      sortedClasses.forEach(cls => {
        if (placed.has(cls.id)) return;

        const col = currentIndex % cols;
        const row = Math.floor(currentIndex / cols);
        newPositions.set(cls.id, {
          x: startX + col * cellWidth,
          y: startY + row * cellHeight
        });
        placed.add(cls.id);
        currentIndex++;

        // Intentar colocar clases relacionadas cerca
        const related = relationMap.get(cls.id);
        if (related) {
          related.forEach(relatedId => {
            if (!placed.has(relatedId) && currentIndex < classes.length) {
              const relatedCol = currentIndex % cols;
              const relatedRow = Math.floor(currentIndex / cols);
              newPositions.set(relatedId, {
                x: startX + relatedCol * cellWidth,
                y: startY + relatedRow * cellHeight
              });
              placed.add(relatedId);
              currentIndex++;
            }
          });
        }
      });

      // Agregar clases restantes que no fueron colocadas
      classes.forEach(cls => {
        if (!newPositions.has(cls.id)) {
          const col = currentIndex % cols;
          const row = Math.floor(currentIndex / cols);
          newPositions.set(cls.id, {
            x: startX + col * cellWidth,
            y: startY + row * cellHeight
          });
          currentIndex++;
        }
      });

      return newPositions;
    }

    return positionMap;
  }

  /**
   * ============== MÉTODOS DEL AGENTE MEJORADOR ==============
   */

  /**
   * Abre el modal del agente mejorador
   */
  openImproveAgent(): void {
    if (this.classes.length === 0) {
      alert('Por favor crea un diagrama primero.');
      return;
    }
    this.showImproveAgent = true;
  }

  /**
   * Abre el modal de exportar/importar
   */
  openExportImportModal(): void {
    this.showExportImportModal = true;
  }

  /**
   * Exporta el diagrama como imagen PNG
   */
  async exportAsImage(): Promise<void> {
    try {
      // Usar html2canvas si está disponible, sino usar método alternativo
      const canvasArea = document.querySelector('.canvas-area') as HTMLElement;
      if (!canvasArea) {
        alert('No se pudo encontrar el área del canvas');
        return;
      }

      // Verificar si html2canvas está disponible
      if (typeof (window as any).html2canvas !== 'undefined') {
        const html2canvas = (window as any).html2canvas;
        const canvas = await html2canvas(canvasArea, {
          backgroundColor: this.themeService.isDarkTheme() ? '#1a1a1a' : '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true
        });

        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagrama-uml-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            this.statusMessage = 'Diagrama exportado como imagen exitosamente.';
            setTimeout(() => this.statusMessage = '', 3000);
          }
        }, 'image/png');
      } else {
        // Método alternativo usando SVG
        this.exportAsImageSVG();
      }
    } catch (error) {
      console.error('Error al exportar imagen:', error);
      alert('Error al exportar la imagen. Por favor intenta de nuevo.');
    }
  }

  /**
   * Método alternativo para exportar como imagen usando SVG
   */
  private exportAsImageSVG(): void {
    const svg = document.querySelector('.svg-canvas') as SVGSVGElement;
    if (!svg) {
      alert('No se pudo encontrar el SVG del diagrama');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = this.themeService.isDarkTheme() ? '#1a1a1a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `diagrama-uml-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            this.statusMessage = 'Diagrama exportado como imagen exitosamente.';
            setTimeout(() => this.statusMessage = '', 3000);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }

  /**
   * Exporta el diagrama como PDF
   */
  async exportAsPDF(): Promise<void> {
    try {
      // Verificar si jsPDF está disponible
      if (typeof (window as any).jspdf !== 'undefined') {
        const { jsPDF } = (window as any).jspdf;
        
        // Primero exportar como imagen
        const canvasArea = document.querySelector('.canvas-area') as HTMLElement;
        if (!canvasArea) {
          alert('No se pudo encontrar el área del canvas');
          return;
        }

        let imageData: string;
        
        if (typeof (window as any).html2canvas !== 'undefined') {
          const html2canvas = (window as any).html2canvas;
          const canvas = await html2canvas(canvasArea, {
            backgroundColor: this.themeService.isDarkTheme() ? '#1a1a1a' : '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
          });
          imageData = canvas.toDataURL('image/png');
        } else {
          // Usar método SVG alternativo
          const svg = document.querySelector('.svg-canvas') as SVGSVGElement;
          if (!svg) {
            alert('No se pudo encontrar el SVG del diagrama');
            return;
          }
          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          imageData = URL.createObjectURL(svgBlob);
        }

        // Crear PDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 297; // A4 width in mm
        const imgHeight = (canvasArea.offsetHeight / canvasArea.offsetWidth) * imgWidth;

        pdf.addImage(imageData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`diagrama-uml-${Date.now()}.pdf`);

        this.statusMessage = 'Diagrama exportado como PDF exitosamente.';
        setTimeout(() => this.statusMessage = '', 3000);
      } else {
        // Fallback: descargar como imagen y sugerir conversión manual
        alert('La librería jsPDF no está disponible. Exportando como imagen en su lugar.');
        await this.exportAsImage();
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor intenta de nuevo.');
    }
  }

  /**
   * Importa un diagrama desde JSON
   */
  importFromJson(jsonContent: string): void {
    try {
      const diagram = JSON.parse(jsonContent);
      
      if (!diagram.classes || !Array.isArray(diagram.classes)) {
        throw new Error('Formato de diagrama inválido');
      }

      // Confirmar antes de importar
      if (this.classes.length > 0) {
        if (!confirm('¿Estás seguro de que quieres importar este diagrama? Se reemplazará el diagrama actual.')) {
          return;
        }
      }

      // Limpiar el diagrama actual
      this.diagramService.clearDiagram();

      // Cargar el nuevo diagrama
      if (diagram.classes && diagram.relations) {
        this.diagramService.loadDiagramState(diagram.classes, diagram.relations);
        this.statusMessage = `Diagrama importado exitosamente: ${diagram.classes.length} clases y ${diagram.relations.length} relaciones.`;
        setTimeout(() => this.statusMessage = '', 5000);
      } else {
        throw new Error('El diagrama no tiene la estructura correcta');
      }
    } catch (error) {
      console.error('Error al importar JSON:', error);
      alert('Error al importar el diagrama. Por favor verifica que el archivo JSON sea válido.');
    }
  }

  /**
   * Maneja el diagrama mejorado del agente
   */
  onDiagramImproved(improvedDiagram: UMLDiagram): void {
    console.log('Diagrama mejorado recibido:', improvedDiagram);

    // Crear mapa de IDs para traducción
    const idMap = new Map<string, string>();

    // Actualizar clases existentes y agregar nuevas
    improvedDiagram.classes.forEach((improvedClass) => {
      const existingClass = this.classes.find(c => c.id === improvedClass.id);

      if (existingClass) {
        // Actualizar clase existente
        existingClass.name = improvedClass.name;
        existingClass.attributes = improvedClass.attributes;
        existingClass.methods = improvedClass.methods;
        existingClass.position = improvedClass.position;
        existingClass.stereotype = improvedClass.stereotype;
        idMap.set(improvedClass.id, improvedClass.id);
      } else {
        // Agregar nueva clase
        const newId = improvedClass.id;
        this.classes.push(improvedClass);
        idMap.set(newId, newId);
      }
    });

    // Remover clases que ya no existen en el diagrama mejorado
    this.classes = this.classes.filter(c => 
      improvedDiagram.classes.some(ic => ic.id === c.id)
    );

    // Actualizar relaciones
    this.relations = improvedDiagram.relations.map(rel => ({
      ...rel,
      fromClassId: idMap.get(rel.fromClassId) || rel.fromClassId,
      toClassId: idMap.get(rel.toClassId) || rel.toClassId
    }));

    // Actualizar el diagrama en el servicio
    const currentDiagram = this.diagramService.getDiagram();
    const updatedDiagram: UMLDiagram = {
      ...currentDiagram,
      name: improvedDiagram.name || currentDiagram.name,
      classes: this.classes,
      relations: this.relations
    };
    
    // Usar el diagramSubject para actualizar (acceso directo)
    (this.diagramService as any).diagramSubject.next(updatedDiagram);
    this.statusMessage = `✨ Diagrama mejorado con éxito! ${improvedDiagram.classes.length} clases y ${improvedDiagram.relations.length} relaciones.`;
    setTimeout(() => this.statusMessage = '', 5000);
  }

}
