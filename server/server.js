const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Configure CORS properly
const io = new Server(server, {
  cors: {
    origin: 'https://videochats-app.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// User and room management
const userSessions = new Map();
const waitingQueue = [];
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  socket.on('join', (userId) => {
    userSessions.set(socket.id, userId);
    waitingQueue.push(socket.id);
    socket.emit('status', 'Searching for a partner...');
    tryToPairUsers();
  });

  // Handle WebRTC signaling
  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    const roomId = [...activeRooms.entries()]
      .find(([roomId, users]) => users.includes(socket.id))?.[0];
      
    if (roomId) {
      const usersInRoom = activeRooms.get(roomId);
      const partnerId = usersInRoom.find(id => id !== socket.id);
      
      if (partnerId) {
        io.to(partnerId).emit('partner_disconnected');
      }
      
      activeRooms.delete(roomId);
    }
    
    // Remove from waiting queue
    const index = waitingQueue.indexOf(socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }
    
    userSessions.delete(socket.id);
    console.log(`Disconnected: ${socket.id}`);
  });

  // Handle "next partner" requests
  socket.on('next', () => {
    const roomId = [...activeRooms.entries()]
      .find(([roomId, users]) => users.includes(socket.id))?.[0];
      
    if (roomId) {
      socket.leave(roomId);
      const usersInRoom = activeRooms.get(roomId);
      const partnerId = usersInRoom.find(id => id !== socket.id);
      
      if (partnerId) {
        io.to(partnerId).emit('partner_disconnected');
      }
      
      activeRooms.delete(roomId);
    }
    
    // Rejoin queue
    waitingQueue.push(socket.id);
    socket.emit('status', 'Searching for new partner...');
    tryToPairUsers();
  });
});

// Pair users from the waiting queue
function tryToPairUsers() {
  if (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();
    const roomId = `room_${Date.now()}`;
    
    activeRooms.set(roomId, [user1, user2]);
    
    io.to(user1).emit('paired', { roomId, partnerId: user2 });
    io.to(user2).emit('paired', { roomId, partnerId: user1 });
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));