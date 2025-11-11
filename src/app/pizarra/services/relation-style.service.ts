import { Injectable } from '@angular/core';
import { RelationType } from '../interfaces/uml-models';


export interface RelationStyle {
  color: string;
  dashArray: string;
  marker: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class RelationStyleService {

  private readonly relationColors = {
    association: '#333333',      // Negro para asociación
    aggregation: '#4CAF50',      // Verde para agregación
    composition: '#F44336',      // Rojo para composición
    inheritance: '#2196F3',      // Azul para herencia
    realization: '#FF9800',      // Naranja para realización
    dependency: '#9C27B0',       // Púrpura para dependencia
    associationClass: '#3F51B5'  // Azul oscuro para clase de asociación
  };

  private readonly relationDashPatterns = {
    association: '',           // Línea sólida
    aggregation: '',           // Línea sólida
    composition: '',           // Línea sólida
    inheritance: '',           // Línea sólida
    realization: '8,4',        // Línea punteada larga para realización
    dependency: '4,4',         // Línea punteada corta para dependencia
    associationClass: '4,4'    // Línea punteada corta para clase de asociación
  };

  private readonly relationMarkers = {
    association: '',  // Sin marcador - línea simple
    aggregation: 'url(#aggregation-diamond)',
    composition: 'url(#composition-diamond)',
    inheritance: 'url(#inheritance-arrow)',
    realization: 'url(#realization-arrow)',
    dependency: 'url(#dependency-arrow)',
    associationClass: 'url(#association-class-arrow)'
  };

  private readonly relationDescriptions = {
    association: 'Relación básica entre clases',
    aggregation: 'Relación "tiene-un" débil (parte puede existir sin el todo)',
    composition: 'Relación "tiene-un" fuerte (parte no puede existir sin el todo)',
    inheritance: 'Relación "es-un" (herencia de clase)',
    realization: 'Implementación de interface',
    dependency: 'Una clase usa otra clase',
    associationClass: 'Relación que también es una clase'
  };

  constructor() { }

  /**
   * Obtiene el color para un tipo de relación específico
   */
  getRelationColor(type: RelationType): string {
    return this.relationColors[type] || this.relationColors.association;
  }

  /**
   * Obtiene el patrón de línea punteada para un tipo de relación
   */
  getRelationDashArray(type: RelationType): string {
    return this.relationDashPatterns[type] || '';
  }

  /**
   * Obtiene el marcador (flecha/diamante) para un tipo de relación
   */
  getRelationMarker(type: RelationType): string {
    return this.relationMarkers[type] || this.relationMarkers.association;
  }

  /**
   * Obtiene la descripción para un tipo de relación
   */
  getRelationDescription(type: RelationType): string {
    return this.relationDescriptions[type] || '';
  }

  /**
   * Obtiene todos los estilos para un tipo de relación
   */
  getRelationStyle(type: RelationType): RelationStyle {
    return {
      color: this.getRelationColor(type),
      dashArray: this.getRelationDashArray(type),
      marker: this.getRelationMarker(type),
      description: this.getRelationDescription(type)
    };
  }

  /**
   * Obtiene todos los tipos de relación disponibles con sus estilos
   */
  getAllRelationTypes(): Array<{ type: RelationType; style: RelationStyle }> {
    const types: RelationType[] = [
      'association',
      'aggregation', 
      'composition',
      'inheritance',
      'realization',
      'dependency',
      'associationClass'
    ];

    return types.map(type => ({
      type,
      style: this.getRelationStyle(type)
    }));
  }

  /**
   * Obtiene la configuración de colores para temas
   */
  getThemeColors(isDarkTheme: boolean = false) {
    if (isDarkTheme) {
      return {
        association: '#e0e0e0',
        aggregation: '#66BB6A',
        composition: '#EF5350',
        inheritance: '#42A5F5',
        realization: '#FFA726',
        dependency: '#AB47BC',
        associationClass: '#5C6BC0'
      };
    }
    return this.relationColors;
  }

  /**
   * Actualiza los colores según el tema
   */
  updateColorsForTheme(isDarkTheme: boolean): void {
    const themeColors = this.getThemeColors(isDarkTheme);
    Object.assign(this.relationColors, themeColors);
  }

  /**
   * Obtiene información completa de una relación para la leyenda
   */
  getLegendInfo(): Array<{
    type: RelationType;
    displayName: string;
    color: string;
    dashArray: string;
    marker: string;
    description: string;
  }> {
    const displayNames = {
      association: 'Asociación',
      aggregation: 'Agregación', 
      composition: 'Composición',
      inheritance: 'Herencia',
      realization: 'Realización',
      dependency: 'Dependencia',
      associationClass: 'Clase de Asociación'
    };

    return Object.keys(this.relationColors).map(type => ({
      type: type as RelationType,
      displayName: displayNames[type as RelationType],
      color: this.getRelationColor(type as RelationType),
      dashArray: this.getRelationDashArray(type as RelationType),
      marker: this.getRelationMarker(type as RelationType),
      description: this.getRelationDescription(type as RelationType)
    }));
  }
}