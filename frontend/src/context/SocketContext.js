import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  const socket = io('https://video-lb8z.onrender.com', {
    transports: ['websocket'],
    reconnection: true
  });

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};