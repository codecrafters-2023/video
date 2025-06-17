const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Configure CORS properly
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://videochats-app.vercel.app', 'http://localhost:3000'];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// User and room management
let waitingQueue = [];
const activeRooms = new Map();
const userRoomMap = new Map();  // socketId -> roomId (reverse mapping)

// Cleanup disconnected users periodically
setInterval(() => {
    const initialCount = waitingQueue.length;
    
    // Remove disconnected users from queue
    waitingQueue = waitingQueue.filter(id => io.sockets.sockets.has(id));
    
    // Check active rooms for disconnected users
    activeRooms.forEach((users, roomId) => {
        const disconnectedUsers = users.filter(id => !io.sockets.sockets.has(id));
        
        if (disconnectedUsers.length > 0) {
            // Notify connected partner if only one disconnected
            const connectedUsers = users.filter(id => io.sockets.sockets.has(id));
            if (connectedUsers.length === 1) {
                io.to(connectedUsers[0]).emit('partner_disconnected');
            }
            
            // Delete room and mappings
            activeRooms.delete(roomId);
            users.forEach(id => userRoomMap.delete(id));
        }
    });
    
    console.log(`Cleaned ${initialCount - waitingQueue.length} disconnected users. Active rooms: ${activeRooms.size}`);
}, 30000); // Every 30 seconds

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('join', (userId) => {
        console.log(`User ${userId} (${socket.id}) joined queue`);
        
        // Only add to queue if not already waiting or in a room
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
            tryToPairUsers();
        }
    });

    // Handle WebRTC signaling with security validation
    socket.on('signal', (data) => {
        const senderRoom = userRoomMap.get(socket.id);
        const targetRoom = userRoomMap.get(data.to);
        
        // Validate both users are in the same room
        if (senderRoom && senderRoom === targetRoom) {
            io.to(data.to).emit('signal', {
                from: socket.id,
                type: data.type,
                offer: data.offer,
                answer: data.answer,
                candidate: data.candidate
            });
        } else {
            console.warn(`Invalid signal attempt from ${socket.id} to ${data.to}`);
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        cleanupUser(socket.id);
    });

    // Handle "next partner" requests
    socket.on('next', () => {
        console.log(`Next requested by: ${socket.id}`);
        cleanupUser(socket.id, true); // Keep in queue
        
        // Rejoin queue
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
            tryToPairUsers();
        }
    });
});

// Cleanup user resources
function cleanupUser(socketId, keepInQueue = false) {
    // Remove from waiting queue unless requested to keep
    if (!keepInQueue) {
        const queueIndex = waitingQueue.indexOf(socketId);
        if (queueIndex !== -1) {
            waitingQueue.splice(queueIndex, 1);
        }
    }

    // Cleanup rooms
    const roomId = userRoomMap.get(socketId);
    if (roomId) {
        const users = activeRooms.get(roomId) || [];
        const partnerId = users.find(id => id !== socketId);

        if (partnerId) {
            io.to(partnerId).emit('partner_disconnected');
            userRoomMap.delete(partnerId);
        }

        activeRooms.delete(roomId);
        userRoomMap.delete(socketId);
    }
}

// Pair users from the waiting queue atomically
function tryToPairUsers() {
    // Filter out disconnected users
    const activeUsers = waitingQueue.filter(id => io.sockets.sockets.has(id));
    
    while (activeUsers.length >= 2) {
        const user1 = activeUsers.shift();
        const user2 = activeUsers.shift();
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        
        // Update actual waiting queue by removing paired users
        waitingQueue = waitingQueue.filter(id => id !== user1 && id !== user2);
        
        // Create room mappings
        activeRooms.set(roomId, [user1, user2]);
        userRoomMap.set(user1, roomId);
        userRoomMap.set(user2, roomId);

        console.log(`Paired ${user1} and ${user2} in room ${roomId}`);
        
        // User1 is always the initiator
        io.to(user1).emit('paired', {
            roomId,
            partnerId: user2,
            isInitiator: true
        });

        io.to(user2).emit('paired', {
            roomId,
            partnerId: user1,
            isInitiator: false
        });
    }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));