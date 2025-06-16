const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const roomManager = require('./utils/roomManager');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

connectDB();

// User session management
const userSessions = new Map();

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  socket.on('join', (userId) => {
    userSessions.set(socket.id, userId);
    roomManager.addUserToQueue(socket.id);
    socket.emit('status', 'Searching for a partner...');
    tryPairUsers();
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  socket.on('disconnect', () => {
    const roomId = roomManager.getUserRoom(socket.id);
    if (roomId) {
      socket.to(roomId).emit('partner_disconnected');
      roomManager.cleanupRoom(roomId);
    }
    userSessions.delete(socket.id);
    roomManager.removeUserFromQueue(socket.id);
    console.log(`Disconnected: ${socket.id}`);
  });

  socket.on('next', () => {
    const roomId = roomManager.getUserRoom(socket.id);
    if (roomId) {
      socket.leave(roomId);
      socket.to(roomId).emit('partner_disconnected');
      roomManager.cleanupRoom(roomId);
    }
    roomManager.addUserToQueue(socket.id);
    socket.emit('status', 'Searching for new partner...');
    tryPairUsers();
  });
});

function tryPairUsers() {
  const users = roomManager.getWaitingUsers();
  if (users.length >= 2) {
    const [user1, user2] = users.slice(0, 2);
    const roomId = `room_${Date.now()}`;
    
    roomManager.createRoom(roomId, [user1, user2]);
    roomManager.removeUserFromQueue(user1);
    roomManager.removeUserFromQueue(user2);
    
    io.to(user1).emit('paired', { roomId, partnerId: user2 });
    io.to(user2).emit('paired', { roomId, partnerId: user1 });
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));