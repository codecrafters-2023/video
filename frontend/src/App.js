import React from 'react';
import VideoChat from './components/VideoChat';
import { SocketProvider } from './context/SocketContext';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <div className="app">
        <header>
          <h1>Omegle Clone</h1>
        </header>
        <main>
          <VideoChat />
        </main>
        <footer>
          <p>MERN Video Chat App</p>
        </footer>
      </div>
    </SocketProvider>
  );
}

export default App;