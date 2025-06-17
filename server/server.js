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
let waitingQueue = []; // Changed to let
const activeRooms = new Map();

// Cleanup disconnected users periodically
setInterval(() => {
    const initialCount = waitingQueue.length;
    waitingQueue = waitingQueue.filter(id => io.sockets.sockets.has(id));
    console.log(`Cleaned ${initialCount - waitingQueue.length} disconnected users from queue. Current size: ${waitingQueue.length}`);
}, 30000); // Every 30 seconds

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('join', (userId) => {
        console.log(`User ${userId} (${socket.id}) joined queue`);

        // Add to queue if not already present
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
        }

        socket.emit('status', 'Searching for a partner...');
        tryToPairUsers();
    });

    // Handle WebRTC signaling
    socket.on('signal', (data) => {
        console.log(`Signal from ${socket.id} to ${data.to}`);
        io.to(data.to).emit('signal', {
            from: socket.id,
            type: data.type,
            offer: data.offer,
            answer: data.answer,
            candidate: data.candidate
        });
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
        cleanupUser(socket.id);
    });

    // Handle "next partner" requests
    socket.on('next', () => {
        console.log(`Next requested by: ${socket.id}`);
        cleanupUser(socket.id);

        // Rejoin queue
        if (!waitingQueue.includes(socket.id)) {
            waitingQueue.push(socket.id);
        }
        socket.emit('status', 'Searching for new partner...');
        tryToPairUsers();
    });
});

// Cleanup user resources
function cleanupUser(socketId) {
    // Remove from waiting queue
    const queueIndex = waitingQueue.indexOf(socketId);
    if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
    }

    // Cleanup rooms
    for (const [roomId, users] of activeRooms.entries()) {
        const userIndex = users.indexOf(socketId);
        if (userIndex !== -1) {
            const partnerId = users.find(id => id !== socketId);

            if (partnerId) {
                io.to(partnerId).emit('partner_disconnected');
            }

            activeRooms.delete(roomId);
            break;
        }
    }
}

// Pair users from the waiting queue
function tryToPairUsers() {
    console.log(`Trying to pair users. Queue size: ${waitingQueue.length}`);

    // Filter out disconnected users
    const activeUsers = waitingQueue.filter(id => io.sockets.sockets.has(id));

    if (activeUsers.length >= 2) {
        const user1 = activeUsers.shift();
        const user2 = activeUsers.shift();
        const roomId = `room_${Date.now()}`;

        // Update the actual waiting queue
        waitingQueue = activeUsers;

        activeRooms.set(roomId, [user1, user2]);

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