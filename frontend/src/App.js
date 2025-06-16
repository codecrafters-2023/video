import React from 'react';
import VideoChat from './components/VideoChat';
import { SocketProvider } from './context/SocketContext';
import './index.css';

function App() {
  return (
    <SocketProvider>
      <div className="app">
        <header>
          <h1>Omegle Clone</h1>
          <p>Random Video Chat with Strangers</p>
        </header>
        <main>
          <VideoChat />
        </main>
        <footer>
          <p>Built with MERN Stack & WebRTC</p>
          <small>Note: This is a demo app. Use responsibly.</small>
        </footer>
      </div>
    </SocketProvider>
  );
}

export default App;