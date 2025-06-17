import React from 'react';
import VideoChat from './components/VideoChat/VideoChat';
// import { SocketProvider } from './context/SocketContext';
import './index.css';
import HomePage from './components/Home';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import PrivacyPolicy from './components/PrivacyPolicy/PrivacyPolicy';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<VideoChat />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        </Routes>
      </BrowserRouter>
    </>
    // <SocketProvider>
    //   <div className="app">
    //     <header>
    //       <h1>Omegle Clone</h1>
    //       <p>Random Video Chat with Strangers</p>
    //     </header>
    //     <main>
    //       <VideoChat />
    //     </main>
    //     <footer>
    //       <p>Built with MERN Stack & WebRTC</p>
    //       <small>Note: This is a demo app. Use responsibly.</small>
    //     </footer>
    //   </div>
    // </SocketProvider>
  );
}

export default App;