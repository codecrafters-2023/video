const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Configure CORS properly
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? ['https://videochats-app.vercel.app', 'http://localhost:3000'].split(',')
    : ['https://videochats-app.vercel.app', 'http://localhost:3000'];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// User and room management
const waitingQueue = [];
const activeRooms = new Map();

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('join', (userId) => {
        console.log(`User ${userId} (${socket.id}) joined queue`);
        waitingQueue.push(socket.id);
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
        waitingQueue.push(socket.id);
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

    while (waitingQueue.length >= 2) {
        const user1 = waitingQueue.shift();
        const user2 = waitingQueue.shift();
        const roomId = `room_${Date.now()}`;

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