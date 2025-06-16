const queue = [];
const rooms = new Map();

module.exports = {
  addUserToQueue: (userId) => {
    if (!queue.includes(userId)) queue.push(userId);
  },
  
  removeUserFromQueue: (userId) => {
    const index = queue.indexOf(userId);
    if (index !== -1) queue.splice(index, 1);
  },
  
  getWaitingUsers: () => [...queue],
  
  createRoom: (roomId, users) => {
    rooms.set(roomId, {
      users,
      createdAt: Date.now()
    });
    users.forEach(user => {
      const userRooms = rooms.get(user) || [];
      userRooms.push(roomId);
      rooms.set(user, userRooms);
    });
  },
  
  getUserRoom: (userId) => {
    const userRooms = rooms.get(userId);
    return userRooms ? userRooms[userRooms.length - 1] : null;
  },
  
  cleanupRoom: (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.forEach(userId => {
        const userRooms = rooms.get(userId) || [];
        const index = userRooms.indexOf(roomId);
        if (index !== -1) userRooms.splice(index, 1);
        if (userRooms.length === 0) rooms.delete(userId);
        else rooms.set(userId, userRooms);
      });
      rooms.delete(roomId);
    }
  }
};