import { Injectable } from '@angular/core';
import { UMLClass, UMLRelation } from '../../interfaces/uml-models';

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ConnectionPoints {
  start: Point;
  end: Point;
}

@Injectable({
  providedIn: 'root'
})
export class GeometryCalculatorService {

  // Constantes de dimensiones de clases UML
  private readonly CLASS_WIDTH = 180;
  private readonly CLASS_HEADER_HEIGHT = 36; // 10 + 16 + 10
  private readonly CLASS_SECTION_PADDING = 8;
  private readonly ITEM_HEIGHT = 21; // 12 * 1.4 + 4
  private readonly ADD_BUTTON_HEIGHT = 23; // 11 + 8 + 4
  private readonly CONNECTION_MARGIN = 8;
  private readonly MULTIPLICITY_OFFSET = 15;
  private readonly LABEL_OFFSET = 10;

  constructor() { }

  /**
   * Calcula los puntos de conexión entre dos clases para una relación
   */
  calculateConnectionPoints(relation: UMLRelation, classes: UMLClass[]): ConnectionPoints {
    const fromClass = classes.find(c => c.id === relation.fromClassId);
    const toClass = classes.find(c => c.id === relation.toClassId);

    if (!fromClass || !toClass) {
      return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    }

    // Caso especial: Auto-relación (la clase apunta a sí misma)
    if (fromClass.id === toClass.id) {
      return this.calculateSelfRelationPoints(fromClass);
    }

    const fromBounds = this.calculateClassBounds(fromClass);
    const toBounds = this.calculateClassBounds(toClass);

    const fromCenter = this.getCenter(fromBounds);
    const toCenter = this.getCenter(toBounds);

    const startPoint = this.findIntersectionPoint(fromCenter, toCenter, fromBounds);
    const endPoint = this.findIntersectionPoint(toCenter, fromCenter, toBounds);

    const correctedStartPoint = this.ensurePointOnBorder(startPoint, fromBounds);
    const correctedEndPoint = this.ensurePointOnBorder(endPoint, toBounds);

    return this.applyConnectionMargin(correctedStartPoint, correctedEndPoint, fromCenter, toCenter, fromClass, toClass);
  }

  /**
   * Calcula los puntos de conexión para una auto-relación (relación reflexiva)
   * El bucle saldrá del lado derecho de la clase
   */
  private calculateSelfRelationPoints(umlClass: UMLClass): ConnectionPoints {
    const bounds = this.calculateClassBounds(umlClass);
    const center = this.getCenter(bounds);

    // Punto de inicio: lado derecho superior de la clase (1/3 de altura desde arriba)
    const startPoint: Point = {
      x: bounds.right + 10, // Pequeño margen para que salga de la clase
      y: center.y - 20
    };

    // Punto final: lado derecho inferior (2/3 de altura desde arriba)
    const endPoint: Point = {
      x: bounds.right + 10, // Pequeño margen para que salga de la clase
      y: center.y + 25
    };

    // Debug - imprimir coordenadas
    console.log('🔄 Auto-relación detectada:', {
      className: umlClass.name,
      bounds: bounds,
      center: center,
      startPoint: startPoint,
      endPoint: endPoint
    });

    return { start: startPoint, end: endPoint };
  }

  /**
   * Calcula las dimensiones y posición de una clase UML
   */
  calculateClassBounds(umlClass: UMLClass): Bounds {
    const attributesHeight = (umlClass.attributes.length * this.ITEM_HEIGHT) +
      this.ADD_BUTTON_HEIGHT +
      this.CLASS_SECTION_PADDING * 2;

    const methodsHeight = (umlClass.methods!.length * this.ITEM_HEIGHT) +
      this.ADD_BUTTON_HEIGHT +
      this.CLASS_SECTION_PADDING * 2;

    const totalHeight = this.CLASS_HEADER_HEIGHT + attributesHeight + methodsHeight;

    return {
      left: umlClass.position.x,
      right: umlClass.position.x + this.CLASS_WIDTH,
      top: umlClass.position.y,
      bottom: umlClass.position.y + totalHeight
    };
  }

  /**
   * Encuentra el punto de intersección entre una línea y un rectángulo
   */
  findIntersectionPoint(center: Point, targetCenter: Point, bounds: Bounds): Point {
    const dx = targetCenter.x - center.x;
    const dy = targetCenter.y - center.y;

    if (dx === 0 && dy === 0) {
      return center;
    }

    const intersections: Array<Point & { distance: number }> = [];

    // Intersección con lado izquierdo
    if (dx !== 0) {
      //console.log('Calculando intersección con lado izquierdo');
      const t = (bounds.left - center.x) / dx;
      if (t >= 0) {
        const y = center.y + t * dy;
        if (y >= bounds.top && y <= bounds.bottom) {
          intersections.push({ x: bounds.left, y, distance: Math.abs(t) });
        }
      }
    }

    // Intersección con lado derecho
    if (dx !== 0) {
      const t = (bounds.right - center.x) / dx;
      if (t >= 0) {
        const y = center.y + t * dy;
        if (y >= bounds.top && y <= bounds.bottom) {
          intersections.push({ x: bounds.right, y, distance: Math.abs(t) });
        }
      }
    }

    // Intersección con lado superior
    if (dy !== 0) {
      const t = (bounds.top - center.y) / dy;
      if (t >= 0) {
        const x = center.x + t * dx;
        if (x >= bounds.left && x <= bounds.right) {
          intersections.push({ x, y: bounds.top, distance: Math.abs(t) });
        }
      }
    }

    // Intersección con lado inferior
    if (dy !== 0) {
      const t = (bounds.bottom - center.y) / dy;
      if (t >= 0) {
        const x = center.x + t * dx;
        if (x >= bounds.left && x <= bounds.right) {
          intersections.push({ x, y: bounds.bottom, distance: Math.abs(t) });
        }
      }
    }

    if (intersections.length > 0) {
      intersections.sort((a, b) => a.distance - b.distance);
      return { x: intersections[0].x, y: intersections[0].y };
    }

    return center;
  }

  /**
   * Asegura que un punto esté exactamente en el borde de un área
   */
  ensurePointOnBorder(point: Point, bounds: Bounds): Point {

    const tolerance = 2;

    if (point.x > bounds.left + tolerance && point.x < bounds.right - tolerance &&
      point.y > bounds.top + tolerance && point.y < bounds.bottom - tolerance) {

      const distToLeft = point.x - bounds.left;
      const distToRight = bounds.right - point.x;
      const distToTop = point.y - bounds.top;
      const distToBottom = bounds.bottom - point.y;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft) {
        return { x: bounds.left, y: point.y };
      } else if (minDist === distToRight) {
        return { x: bounds.right, y: point.y };
      } else if (minDist === distToTop) {
        return { x: point.x, y: bounds.top };
      } else {
        return { x: point.x, y: bounds.bottom };
      }
    }

    // Ajustar puntos que están cerca del borde
    if (Math.abs(point.x - bounds.left) <= tolerance) {
      return {
        x: bounds.left,
        y: Math.max(bounds.top, Math.min(bounds.bottom, point.y))
      };
    }
    if (Math.abs(point.x - bounds.right) <= tolerance) {
      return { x: bounds.right, y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)) };
    }
    if (Math.abs(point.y - bounds.top) <= tolerance) {
      return { x: Math.max(bounds.left, Math.min(bounds.right, point.x)), y: bounds.top };
    }
    if (Math.abs(point.y - bounds.bottom) <= tolerance) {
      return { x: Math.max(bounds.left, Math.min(bounds.right, point.x)), y: bounds.bottom };
    }

    return point;
  }

  /**
   * Calcula la posición de multiplicidad en el origen de una relación
   */
  getMultiplicityFromPosition(relation: UMLRelation, classes: UMLClass[]): Point {
    const connection = this.calculateConnectionPoints(relation, classes);
    return this.calculateMultiplicityPosition(connection.start, connection.end, this.MULTIPLICITY_OFFSET);
  }

  /**
   * Calcula la posición de multiplicidad en el destino de una relación
   */
  getMultiplicityToPosition(relation: UMLRelation, classes: UMLClass[]): Point {
    const connection = this.calculateConnectionPoints(relation, classes);
    return this.calculateMultiplicityPosition(connection.end, connection.start, this.MULTIPLICITY_OFFSET);
  }

  /**
   * Calcula la posición de la etiqueta de una relación
   */
  getRelationLabelPosition(relation: UMLRelation, classes: UMLClass[]): Point {
    const connection = this.calculateConnectionPoints(relation, classes);
    return {
      x: (connection.start.x + connection.end.x) / 2,
      y: (connection.start.y + connection.end.y) / 2 - this.LABEL_OFFSET
    };
  }

  /**
   * Métodos auxiliares privados
   */
  private getCenter(bounds: Bounds): Point {
    return {
      x: bounds.left + (bounds.right - bounds.left) / 2,
      y: bounds.top + (bounds.bottom - bounds.top) / 2
    };
  }

  private calculateMultiplicityPosition(
    fromPoint: Point,
    toPoint: Point,
    offset: number,
    isFromPointOnRight: boolean = false
  ): Point {
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return fromPoint;

    const perpX = (-dy / length);
    const perpY = dx / length;

    // Si la relación va hacia la izquierda (dx < 0), no agregar el offset horizontal
    // O si el punto está en el lado derecho de la clase
    //console.log('Calculando posición de multiplicidad:', { dx, dy });
    const horizontalAdjustment = (dx < 0 || isFromPointOnRight) ? -5 : 20;
    const verticalAdjustment = (dy > 50 || isFromPointOnRight) ? 15 : 0;

    return {
      x: fromPoint.x + perpX * offset + horizontalAdjustment,
      y: fromPoint.y + perpY * offset + verticalAdjustment
    };
  }

  private applyConnectionMargin(
    startPoint: Point,
    endPoint: Point,
    fromCenter: Point,
    toCenter: Point,
    fromClass: UMLClass,
    toClass: UMLClass
  ): ConnectionPoints {
    const direction = {
      x: toCenter.x - fromCenter.x,
      y: toCenter.y - fromCenter.y
    };
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

    if (length === 0) {
      return { start: startPoint, end: endPoint };
    }

    const normalizedDirection = {
      x: direction.x / length,
      y: direction.y / length
    };

    const minVerticalThreshold = 80;
    const verticalDistance = Math.abs(toClass.position.y - fromClass.position.y);

    let startX = startPoint.x + normalizedDirection.x * this.CONNECTION_MARGIN;
    let endX = endPoint.x - normalizedDirection.x * this.CONNECTION_MARGIN;
    let startY = startPoint.y + normalizedDirection.y * this.CONNECTION_MARGIN;
    let endY = endPoint.y - normalizedDirection.y * this.CONNECTION_MARGIN;

    // Ajustes para conexiones horizontales
    if (fromClass.position.x < toClass.position.x) {
      startX += 0;
    } else {
      endX += 10;
    }

    // Ajustes para conexiones verticales significativas
    if (verticalDistance >= minVerticalThreshold) {
      if (fromClass.position.y < toClass.position.y) {
        startY -= 20;
      } else {
        endY -= 35;
      }
    }

    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    };
  }

  /**
   * Calcula el punto medio de una relación
   */
  calculateRelationMidpoint(relation: UMLRelation, classes: UMLClass[]): Point {
    const connectionPoints = this.calculateConnectionPoints(relation, classes);
    return {
      x: ((connectionPoints.start.x + connectionPoints.end.x) / 2),
      y: (connectionPoints.start.y + connectionPoints.end.y) / 2
    };
  }

  /**
   * Calcula el punto de conexión entre el medio de una relación y su clase de asociación
   */
  calculateAssociationClassConnection(
    relation: UMLRelation,
    associationClass: UMLClass,
    classes: UMLClass[]
  ): { relationMidpoint: Point; classConnection: Point } {
    const relationMidpoint = this.calculateRelationMidpoint(relation, classes);
    const classBounds = this.calculateClassBounds(associationClass);
    const classCenter = this.getCenter(classBounds);
    // Encontrar el punto en el borde de la clase de asociación más cercano al punto medio
    const classConnection = this.findIntersectionPoint(classCenter, relationMidpoint, classBounds);
    return {
      relationMidpoint,
      classConnection: this.ensurePointOnBorder(classConnection, classBounds)
    };
  }
}