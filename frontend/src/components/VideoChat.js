import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import usePeerConnection from './PeerConnection';

const VideoChat = () => {
  const socket = useSocket();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [status, setStatus] = useState('disconnected');
  const [partnerId, setPartnerId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const localStreamRef = useRef();
  const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));

  // Initialize media
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Media error:', err);
        setStatus('media_error');
      });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('paired', ({ roomId, partnerId }) => {
      setRoomId(roomId);
      setPartnerId(partnerId);
      setStatus('connected');
    });

    socket.on('partner_disconnected', () => {
      setStatus('partner_left');
      setPartnerId(null);
    });

    socket.on('status', (message) => {
      setStatus(message);
    });

    return () => {
      socket.off('paired');
      socket.off('partner_disconnected');
      socket.off('status');
    };
  }, [socket]);

  // Join chat on mount
  useEffect(() => {
    if (socket && status === 'disconnected') {
      socket.emit('join', userId.current);
      setStatus('searching');
    }
  }, [socket, status]);

  // Peer connection
  usePeerConnection(
    localStreamRef.current,
    remoteVideoRef,
    socket,
    partnerId
  );

  const handleNextPartner = () => {
    if (socket) {
      socket.emit('next');
      setStatus('searching');
      setPartnerId(null);
      setRoomId(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div className="video-container">
      <div className="status-bar">Status: {status}</div>
      
      <div className="video-grid">
        <div className="video-wrapper">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-wrapper">
          <video ref={remoteVideoRef} autoPlay playsInline />
          <div className="video-label">Partner</div>
        </div> 
      </div>
      
      <div className="controls">
        <button 
          onClick={handleNextPartner} 
          disabled={status !== 'connected'}
          className="next-btn"
        >
          Next Partner
        </button>
      </div>
    </div>
  );
};

export default VideoChat;