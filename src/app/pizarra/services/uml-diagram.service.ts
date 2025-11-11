import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UMLClass, UMLRelation, UMLDiagram, UMLAttribute, UMLMethod } from '../interfaces/uml-models';
import { v4 as uuidv4 } from 'uuid';


@Injectable({
  providedIn: 'root'
})
export class UMLDiagramService {
  private diagramSubject = new BehaviorSubject<UMLDiagram>({
    id: uuidv4(),
    name: 'Nuevo Diagrama',
    classes: [],
    relations: []
  });

  public diagram$ = this.diagramSubject.asObservable();
  private currentDiagramId: string | null = null;
  constructor() {}

  getDiagram(): UMLDiagram {
    return this.diagramSubject.value;
  }

  // Métodos para clases
  addClass(position: { x: number; y: number }): UMLClass {
    const newClass: UMLClass = {
      id: uuidv4(),
      name: 'NuevaClase',
      attributes: [],
      methods: [],
      position: position
    };
    const currentDiagram = this.diagramSubject.value;
    const updatedDiagram = {
      ...currentDiagram,
      classes: [...currentDiagram.classes, newClass]
    };

    this.diagramSubject.next(updatedDiagram);
    return newClass;
  }

  updateClass(classId: string, updates: Partial<UMLClass>): void {
    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => 
      cls.id === classId ? { ...cls, ...updates } : cls
    );

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

  deleteClass(classId: string): void {
    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.filter(cls => cls.id !== classId);
    const updatedRelations = currentDiagram.relations.filter(
      rel => rel.fromClassId !== classId && rel.toClassId !== classId
    );

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses,
      relations: updatedRelations
    });
  }

  // Métodos para atributos
  addAttribute(classId: string): void {
    const newAttribute: UMLAttribute = {
      id: uuidv4(),
      name: 'nuevoAtributo',
      type: 'string',
      visibility: 'public'
    };

    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          attributes: [...cls.attributes, newAttribute]
        };
      }
      return cls;
    });

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

  updateAttribute(classId: string, attributeId: string, updates: Partial<UMLAttribute>): void {
    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => {
      if (cls.id === classId) {
        const updatedAttributes = cls.attributes.map(attr =>
          attr.id === attributeId ? { ...attr, ...updates } : attr
        );
        return { ...cls, attributes: updatedAttributes };
      }
      return cls;
    });

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

  deleteAttribute(classId: string, attributeId: string): void {
    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          attributes: cls.attributes.filter(attr => attr.id !== attributeId)
        };
      }
      return cls;
    });

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

  // Métodos para métodos
  addMethod(classId: string): void {
    const newMethod: UMLMethod = {
      id: uuidv4(),
      name: 'nuevoMetodo',
      returnType: 'void',
      parameters: [],
      visibility: 'public'
    };

    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          methods: [...cls.methods!, newMethod]
        };
      }
      return cls;
    });

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

 

  deleteMethod(classId: string, methodId: string): void {
    const currentDiagram = this.diagramSubject.value;
    const updatedClasses = currentDiagram.classes.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          methods: cls.methods!.filter(method => method.id !== methodId)
        };
      }
      return cls;
    });

    this.diagramSubject.next({
      ...currentDiagram,
      classes: updatedClasses
    });
  }

  // Métodos para relaciones
  addRelation(relation: Omit<UMLRelation, 'id'>, id?: string): UMLRelation {
    const newRelation: UMLRelation = {
      ...relation,
      id: id || uuidv4()
    };
   // console.log('Añadiendo relación:', newRelation); 
    const currentDiagram = this.diagramSubject.value;
    this.diagramSubject.next({
      ...currentDiagram,
      relations: [...currentDiagram.relations, newRelation]
    });
    return newRelation;
  }

  updateRelation(relationId: string, updates: Partial<UMLRelation>): void {
    const currentDiagram = this.diagramSubject.value;
    
    const updatedRelations = currentDiagram.relations.map(rel => {
      console.log('Revisando relación:', rel.id , 'contra:', relationId);
      if (rel.id === relationId) {
        const updatedRel = { ...rel, ...updates };
        
        // Si estamos actualizando multiplicidad, asegurar que se preserve la estructura
        if (updates.multiplicity) {
          updatedRel.multiplicity = {
            ...rel.multiplicity,
            ...updates.multiplicity
          };
        }
        
        return updatedRel;
      }
      return rel;
    });
    
    this.diagramSubject.next({
      ...currentDiagram,
      relations: updatedRelations
    });
  }

  deleteRelation(relationId: string): void {
    const currentDiagram = this.diagramSubject.value;
    const relation = currentDiagram.relations.find(rel => rel.id === relationId);
    
    // Si la relación tiene una clase de asociación, también la eliminamos
    if (relation?.associationClassId) {
      this.deleteClass(relation.associationClassId);
    }
    
    const updatedRelations = currentDiagram.relations.filter(rel => rel.id !== relationId);

    this.diagramSubject.next({
      ...currentDiagram,
      relations: updatedRelations
    });
  }

  /**
   * Crea una clase de asociación para una relación existente
   */
  createAssociationClass(relationId: string): UMLClass | null {
    const currentDiagram = this.diagramSubject.value;
    const relation = currentDiagram.relations.find(rel => rel.id === relationId);
    
    if (!relation) {
      console.error('Relación no encontrada');
      return null;
    }

    // Si ya tiene una clase de asociación, no crear otra
    if (relation.associationClassId) {
      console.warn('Esta relación ya tiene una clase de asociación');
      return null;
    }

    // Calcular posición de la clase de asociación (debajo del punto medio de la relación)
    const fromClass = this.getClassById(relation.fromClassId);
    const toClass = this.getClassById(relation.toClassId);
    
    if (!fromClass || !toClass) {
      console.error('No se encontraron las clases de la relación');
      return null;
    }

    // Calcular punto medio entre las dos clases
    const midX = (fromClass.position.x + toClass.position.x) / 2;
    const midY = (fromClass.position.y + toClass.position.y) / 2;
    
    // Posicionar la clase de asociación desplazada del punto medio
    const position = {
      x: midX - 90, // Centrar aproximadamente (ancho de clase típico es 180)
      y: midY + 80  // Desplazar hacia abajo
    };

    // Crear la clase de asociación
    const associationClass = this.addClass(position);
    associationClass.name = 'ClaseAsociacion';
    associationClass.stereotype = '<<association>>';

    // Actualizar la relación para incluir el ID de la clase de asociación
    this.updateRelation(relationId, { 
      associationClassId: associationClass.id 
    });

    return associationClass;
  }

  /**
   * Elimina la clase de asociación de una relación
   */
  removeAssociationClass(relationId: string): void {
    const currentDiagram = this.diagramSubject.value;
    const relation = currentDiagram.relations.find(rel => rel.id === relationId);
    
    if (!relation?.associationClassId) {
      return;
    }

    // Eliminar la clase
    this.deleteClass(relation.associationClassId);
    
    // Actualizar la relación
    this.updateRelation(relationId, { associationClassId: undefined });
  }

  // Utilidades
  getClassById(classId: string): UMLClass | undefined {
    return this.diagramSubject.value.classes.find(cls => cls.id === classId);
  }

  exportDiagram(): string {
    return JSON.stringify(this.diagramSubject.value, null, 2);
  }


  clearDiagram(): void {
    this.diagramSubject.next({
      id: uuidv4(),
      name: 'Nuevo Diagrama',
      classes: [],
      relations: []
    });
    this.currentDiagramId = null;
  }

  // Cargar estado del diagrama desde socket (sin cambiar ID)
  loadDiagramState(classes: UMLClass[], relations: UMLRelation[]): void {
    const currentDiagram = this.diagramSubject.value;
    this.diagramSubject.next({
      ...currentDiagram,
      classes: classes,
      relations: relations
    });
  }

}