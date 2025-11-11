// Ejemplo de servidor Socket.IO para el diagramador UML colaborativo
// Para usar este servidor:
// 1. npm install socket.io express cors
// 2. node socket-server.js
// 3. Cambiar socketUrl en socket.service.ts a 'http://localhost:3001'

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS para el servidor Express
app.use(cors({
  origin: "http://localhost:4200", // URL de tu aplicación Angular
  methods: ["GET", "POST"]
}));

// Configurar Socket.IO con CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // URL de tu aplicación Angular
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

// Almacén de salas, usuarios y estado del diagrama
const rooms = new Map();
const roomDiagrams = new Map(); // Almacena el estado del diagrama por sala

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Unirse a una sala
  socket.on('join-room', (data) => {
    const { roomId, user } = data;
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.user = user;

    // Agregar usuario a la sala
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(socket.id, user);

    // Inicializar diagrama de la sala si no existe
    if (!roomDiagrams.has(roomId)) {
      roomDiagrams.set(roomId, {
        classes: [],
        relations: []
      });
    }

    // Notificar a otros usuarios en la sala
    const usersInRoom = Array.from(rooms.get(roomId).values());
    socket.to(roomId).emit('user-joined', { users: usersInRoom, newUser: user });
    
    // Enviar lista de usuarios al usuario que se acaba de unir
    socket.emit('users-in-room', usersInRoom);
    
    // Enviar el estado actual del diagrama al nuevo usuario
    const currentDiagram = roomDiagrams.get(roomId);
    socket.emit('diagram-state', currentDiagram);
    
    console.log(`Usuario ${user.name} se unió a la sala ${roomId}`);
    console.log(`Estado del diagrama enviado: ${currentDiagram.classes.length} clases, ${currentDiagram.relations.length} relaciones`);
  });

  // Solicitud explícita del estado del diagrama
  socket.on('request-diagram-state', () => {
    if (socket.roomId && roomDiagrams.has(socket.roomId)) {
      const currentDiagram = roomDiagrams.get(socket.roomId);
      socket.emit('diagram-state', currentDiagram);
      console.log(`Estado del diagrama solicitado en sala ${socket.roomId}`);
    }
  });

  // Eventos de clases UML
  socket.on('class-added', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        diagram.classes.push(event.data);
        roomDiagrams.set(socket.roomId, diagram);
      }
      
      socket.to(socket.roomId).emit('class-added', event);
      console.log(`Clase agregada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  socket.on('class-updated', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        const classIndex = diagram.classes.findIndex(c => c.id === event.data.id);
        if (classIndex !== -1) {
          diagram.classes[classIndex] = event.data;
          roomDiagrams.set(socket.roomId, diagram);
        }
      }
      
      socket.to(socket.roomId).emit('class-updated', event);
      console.log(`Clase actualizada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  socket.on('class-deleted', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        diagram.classes = diagram.classes.filter(c => c.id !== event.data.classId);
        roomDiagrams.set(socket.roomId, diagram);
      }
      
      socket.to(socket.roomId).emit('class-deleted', event);
      console.log(`Clase eliminada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  // Eventos de relaciones UML
  socket.on('relation-added', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        diagram.relations.push(event.data);
        roomDiagrams.set(socket.roomId, diagram);
      }
      
      socket.to(socket.roomId).emit('relation-added', event);
      console.log(`Relación agregada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  socket.on('relation-updated', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        const relationIndex = diagram.relations.findIndex(r => r.id === event.data.id);
        if (relationIndex !== -1) {
          diagram.relations[relationIndex] = event.data;
          roomDiagrams.set(socket.roomId, diagram);
        }
      }
      
      socket.to(socket.roomId).emit('relation-updated', event);
      console.log(`Relación actualizada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  socket.on('relation-deleted', (event) => {
    if (socket.roomId) {
      // Actualizar el estado del diagrama en el servidor
      if (roomDiagrams.has(socket.roomId)) {
        const diagram = roomDiagrams.get(socket.roomId);
        diagram.relations = diagram.relations.filter(r => r.id !== event.data.relationId);
        roomDiagrams.set(socket.roomId, diagram);
      }
      
      socket.to(socket.roomId).emit('relation-deleted', event);
      console.log(`Relación eliminada en sala ${socket.roomId} por ${event.user.name}`);
    }
  });

  // Eventos de cursor (opcional, para mostrar cursores de otros usuarios)
  socket.on('cursor-move', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('cursor-move', data);
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    
    if (socket.roomId && rooms.has(socket.roomId)) {
      const roomUsers = rooms.get(socket.roomId);
      const leftUser = roomUsers.get(socket.id);
      
      roomUsers.delete(socket.id);
      
      // Si la sala está vacía, eliminarla
      if (roomUsers.size === 0) {
        rooms.delete(socket.roomId);
      } else {
        // Notificar a otros usuarios
        const remainingUsers = Array.from(roomUsers.values());
        socket.to(socket.roomId).emit('user-left', { 
          users: remainingUsers, 
          leftUser 
        });
      }
      
      if (leftUser) {
        console.log(`Usuario ${leftUser.name} salió de la sala ${socket.roomId}`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor Socket.IO corriendo en puerto ${PORT}`);
  console.log(`CORS configurado para: http://localhost:4200`);
});

// Endpoint para verificar el estado del servidor
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    totalUsers: Array.from(rooms.values()).reduce((total, room) => total + room.size, 0)
  });
});