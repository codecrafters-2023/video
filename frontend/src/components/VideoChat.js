import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import Peer from 'peerjs';

const VideoChat = () => {
  const socket = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [partnerId, setPartnerId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));

  // Initialize media with proper error handling
  useEffect(() => {
    const initMedia = async () => {
      try {
        // Try to get media with audio only first (more likely to succeed)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { facingMode: 'user' } 
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // If we're not connected, join the queue
        if (socket && status === 'disconnected') {
          socket.emit('join', userId.current);
          setStatus('searching');
        }
      } catch (err) {
        console.error('Media access error:', err);
        setMediaError(err.name);
        setStatus('media_error');
        
        // Try again without video if video fails
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = audioStream;
          setStatus('audio_only');
          
          if (socket && status === 'disconnected') {
            socket.emit('join', userId.current);
            setStatus('searching');
          }
        } catch (audioErr) {
          console.error('Audio-only access error:', audioErr);
          setMediaError(audioErr.name);
          setStatus('media_error');
        }
      }
    };

    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [socket, status]);

  // Socket event handling
  useEffect(() => {
    if (!socket) return;

    const handlePaired = ({ roomId, partnerId }) => {
      setRoomId(roomId);
      setPartnerId(partnerId);
      setStatus('connected');
      initPeerConnection(partnerId);
    };

    const handlePartnerDisconnected = () => {
      setStatus('partner_left');
      setPartnerId(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    const handleStatus = (message) => {
      setStatus(message);
    };

    const handleSignal = ({ from, signal }) => {
      if (peerRef.current && from === partnerId) {
        peerRef.current.signal(signal);
      }
    };

    socket.on('paired', handlePaired);
    socket.on('partner_disconnected', handlePartnerDisconnected);
    socket.on('status', handleStatus);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('paired', handlePaired);
      socket.off('partner_disconnected', handlePartnerDisconnected);
      socket.off('status', handleStatus);
      socket.off('signal', handleSignal);
    };
  }, [socket, partnerId]);

  // Initialize peer connection
  const initPeerConnection = (targetId) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    // Create new peer connection
    const peer = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/peerjs',
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('Peer ID:', id);
      
      // Call the partner if we have a stream
      if (localStreamRef.current) {
        const call = peer.call(targetId, localStreamRef.current);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      }
    });

    peer.on('call', (call) => {
      if (localStreamRef.current) {
        call.answer(localStreamRef.current);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      }
    });

    peer.on('signal', (signal) => {
      if (socket && targetId) {
        socket.emit('signal', { to: targetId, signal });
      }
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setStatus('connection_error');
    });

    peerRef.current = peer;
  };

  const handleNextPartner = () => {
    if (socket) {
      socket.emit('next');
      setStatus('searching');
      setPartnerId(null);
      setRoomId(null);
      
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  const handleRetryMedia = async () => {
    setStatus('retrying');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setMediaError(null);
      setStatus('disconnected');
      
      // Rejoin queue
      if (socket) {
        socket.emit('join', userId.current);
        setStatus('searching');
      }
    } catch (err) {
      console.error('Retry media error:', err);
      setMediaError(err.name);
      setStatus('media_error');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'disconnected': return 'Disconnected';
      case 'searching': return '🔍 Searching for partner...';
      case 'connected': return '✅ Connected to partner';
      case 'partner_left': return '⚠️ Partner disconnected';
      case 'media_error': return '❌ Media error: ' + mediaError;
      case 'audio_only': return '🎤 Audio only mode';
      case 'connection_error': return '⚠️ Connection error';
      case 'retrying': return 'Retrying...';
      default: return status;
    }
  };

  return (
    <div className="video-container">
      <div className="status-bar">{getStatusMessage()}</div>
      
      <div className="video-grid">
        <div className="video-wrapper">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={status === 'audio_only' ? 'audio-only' : ''}
          />
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
          disabled={status !== 'connected' && status !== 'partner_left'}
          className="next-btn"
        >
          Next Partner
        </button>
        
        {status === 'media_error' && (
          <button 
            onClick={handleRetryMedia}
            className="retry-btn"
          >
            Retry Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoChat;