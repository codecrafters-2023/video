import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  // Use environment variable or fallback to production URL
  const socketUrl = process.env.REACT_APP_SOCKET_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://video-lb8z.onrender.com' 
      : 'https://video-lb8z.onrender.com');
  
  const socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
// const socket = io('https://video-lb8z.onrender.com', {