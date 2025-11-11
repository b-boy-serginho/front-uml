import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { UMLClass, UMLRelation, UMLDiagram } from '../interfaces/uml-models';

export interface SocketUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface SocketEvent {
  type: 'class-added' | 'class-updated' | 'class-deleted' | 
        'relation-added' | 'relation-updated' | 'relation-deleted' |
        'user-joined' | 'user-left' | 'cursor-moved';
  data: any;
  user: SocketUser;
  timestamp: number;
}

export interface DiagramState {
  classes: UMLClass[];
  relations: UMLRelation[];
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private users$ = new BehaviorSubject<SocketUser[]>([]);
  private currentUser: SocketUser | null = null;

  // Configuración del servidor Socket.IO (cambiar según tu configuración)
  private readonly socketUrl = 'http://localhost:3001';

  constructor() {}

  connect(roomId: string, user: SocketUser): void {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.socket = io(this.socketUrl, {
      transports: ['websocket', 'polling']
    });

    this.currentUser = user;

    this.socket.on('connect', () => {
      console.log('Conectado a Socket.IO');
      this.connected$.next(true);
      this.joinRoom(roomId, user);
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado de Socket.IO');
      this.connected$.next(false);
    });

    this.socket.on('user-joined', (data: { users: SocketUser[], newUser: SocketUser }) => {
      console.log('Usuario se unió:', data.newUser);
      this.users$.next(data.users);
    });

    this.socket.on('user-left', (data: { users: SocketUser[], leftUser: SocketUser }) => {
      console.log('Usuario se fue:', data.leftUser);
      this.users$.next(data.users);
    });

    this.socket.on('users-in-room', (users: SocketUser[]) => {
      this.users$.next(users);
    });

    // Escuchar el estado inicial del diagrama
    this.socket.on('diagram-state', (state: DiagramState) => {
      console.log('Estado del diagrama recibido:', state);
      // Este evento será manejado en el componente
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
      this.users$.next([]);
      this.currentUser = null;
    }
  }

  private joinRoom(roomId: string, user: SocketUser): void {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, user });
    }
  }

  // Observables para el estado
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  getUsers(): Observable<SocketUser[]> {
    return this.users$.asObservable();
  }

  getCurrentUser(): SocketUser | null {
    return this.currentUser;
  }

  // Eventos de clases UML
  emitClassAdded(umlClass: UMLClass): void {
    this.emitEvent('class-added', umlClass);
  }

  emitClassUpdated(umlClass: UMLClass): void {
    this.emitEvent('class-updated', umlClass);
  }

  emitClassDeleted(classId: string): void {
    this.emitEvent('class-deleted', { classId });
  }

  // Eventos de relaciones UML
  emitRelationAdded(relation: UMLRelation): void {
    this.emitEvent('relation-added', relation);
  }

  emitRelationUpdated(relation: UMLRelation): void {
    console.log('SocketService - Emitiendo relation-updated con relación:', relation);
    this.emitEvent('relation-updated', relation);
  }

  emitRelationDeleted(relationId: string): void {
    this.emitEvent('relation-deleted', { relationId });
  }

  // Eventos de cursor
  emitCursorMove(x: number, y: number): void {
    if (this.socket && this.currentUser) {
      this.socket.emit('cursor-move', { 
        x, 
        y, 
        user: this.currentUser 
      });
    }
  }

  // Escuchar eventos del servidor
  onEvent(eventType: string): Observable<SocketEvent> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on(eventType, (data: SocketEvent) => {
          observer.next(data);
        });
      }
      
      return () => {
        if (this.socket) {
          this.socket.off(eventType);
        }
      };
    });
  }

  onClassAdded(): Observable<SocketEvent> {
    return this.onEvent('class-added');
  }

  onClassUpdated(): Observable<SocketEvent> {
    return this.onEvent('class-updated');
  }

  onClassDeleted(): Observable<SocketEvent> {
    return this.onEvent('class-deleted');
  }

  onRelationAdded(): Observable<SocketEvent> {
    return this.onEvent('relation-added');
  }

  onRelationUpdated(): Observable<SocketEvent> {
    return this.onEvent('relation-updated');
  }

  onRelationDeleted(): Observable<SocketEvent> {
    return this.onEvent('relation-deleted');
  }

  // Escuchar el estado inicial del diagrama
  onDiagramState(): Observable<DiagramState> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('diagram-state', (state: DiagramState) => {
          observer.next(state);
        });
      }
      
      return () => {
        if (this.socket) {
          this.socket.off('diagram-state');
        }
      };
    });
  }

  // Solicitar explícitamente el estado del diagrama
  requestDiagramState(): void {
    if (this.socket) {
      this.socket.emit('request-diagram-state');
      console.log('Solicitando estado del diagrama...');
    }
  }

  onCursorMove(): Observable<{ x: number; y: number; user: SocketUser }> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('cursor-move', (data) => {
          observer.next(data);
        });
      }
      
      return () => {
        if (this.socket) {
          this.socket.off('cursor-move');
        }
      };
    });
  }

  private emitEvent(type: string, data: any): void {
    if (this.socket && this.currentUser) {
      const event: SocketEvent = {
        type: type as any,
        data,
        user: this.currentUser,
        timestamp: Date.now()
      };
      console.log(`SocketService - Emitiendo evento ${type} con datos:`, event);
      this.socket.emit(type, event);
    }
  }

  // Método para obtener el ID de la sala desde la ruta
  static getRoomIdFromRoute(): string {
    const path = window.location.pathname;
    const segments = path.split('/');
    
    // Asumiendo que la ruta es algo como: /diagram/room-id
    // Ajustar según tu estructura de rutas
    const roomIndex = segments.indexOf('diagram');
    if (roomIndex !== -1 && segments[roomIndex + 1]) {
      return segments[roomIndex + 1];
    }
    
    // Si no hay room ID en la ruta, generar uno por defecto
    return 'default-room';
  }

  // Generar un usuario con datos aleatorios
  static generateRandomUser(): SocketUser {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const names = ['Usuario1', 'Usuario2', 'Usuario3', 'Usuario4', 'Usuario5'];
    
    return {
      id: Math.random().toString(36).substring(2, 15),
      name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000),
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }
}