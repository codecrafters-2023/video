import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  // Use relative path in production, absolute in development
  const socketUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'https://video-lb8z.onrender.com';
  
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