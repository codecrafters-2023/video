import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import SimplePeer from 'simple-peer';

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
  const signalQueue = useRef([]);

  // Initialize media with proper error handling
  const initMedia = useCallback(async () => {
    setStatus('requesting_media');
    try {
      // Try to get media with audio only first (more likely to succeed)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Stop any existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setMediaError(null);
      setStatus('searching');

      // If socket is available, join the queue
      if (socket) {
        socket.emit('join', userId.current);
      }
    } catch (err) {
      console.error('Media access error:', err);
      setMediaError(err.name);
      setStatus('media_error');

      // Try again without video if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Stop any existing stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        localStreamRef.current = audioStream;
        setStatus('audio_only');
        setMediaError(null);

        if (socket) {
          socket.emit('join', userId.current);
        }
      } catch (audioErr) {
        console.error('Audio-only access error:', audioErr);
        setMediaError(audioErr.name);
        setStatus('media_error');
      }
    }
  }, [socket]);

  // Initial media acquisition
  useEffect(() => {
    // Check if we're on HTTPS (required for media access)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setStatus('https_required');
      return;
    }

    initMedia();
  }, [initMedia]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Socket event handling
  useEffect(() => {
    if (!socket) return;

    const handlePaired = ({ roomId, partnerId, isInitiator }) => {
      setRoomId(roomId);
      setPartnerId(partnerId);
      setStatus('connected');
      initPeerConnection(partnerId, isInitiator); // Pass initiator status
    };

    const handlePartnerDisconnected = () => {
      setStatus('partner_left');
      setPartnerId(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Cleanup peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };

    const handleSignal = (data) => {
      // If peer connection is ready, signal immediately
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.signal(data.signal);
      } else {
        // Queue the signal if peer not ready
        signalQueue.current.push(data.signal);
      }
    };

    socket.on('paired', handlePaired);
    socket.on('partner_disconnected', handlePartnerDisconnected);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('paired', handlePaired);
      socket.off('partner_disconnected', handlePartnerDisconnected);
      socket.off('signal', handleSignal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Initialize peer connection
  const initPeerConnection = (targetId, isInitiator) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    // Create new peer connection
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      }
    });

    // Add timeout for connection
    const connectionTimer = setTimeout(() => {
      if (!peer.connected) {
        setStatus('connection_timeout');
        peer.destroy();
      }
    }, 15000); // 15 seconds

    peer.on('connect', () => {
      clearTimeout(connectionTimer);
    });

    peer.on('signal', (signal) => {
      if (socket && targetId) {
        socket.emit('signal', { to: targetId, signal });
      }
    });

    peer.on('connect', () => {
      console.log('WebRTC connection established');
      setStatus('connected');
    });

    peer.on('stream', (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    peer.on('error', (err) => {
      console.error('WebRTC error:', err);
      setStatus('connection_error');
    });

    peer.on('close', () => {
      console.log('WebRTC connection closed');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Process any queued signals
    while (signalQueue.current.length > 0) {
      const signal = signalQueue.current.shift();
      peer.signal(signal);
    }

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

      // Clear signal queue
      signalQueue.current = [];
    }
  };

  const handleRetryMedia = useCallback(async () => {
    setStatus('retrying');
    await initMedia();
  }, [initMedia]);

  const getStatusMessage = () => {
    switch (status) {
      case 'disconnected': return 'Disconnected';
      case 'searching': return '🔍 Searching for partner...';
      case 'connected': return '✅ Connected to partner';
      case 'partner_left': return '⚠️ Partner disconnected';
      case 'media_error': return `❌ Media error: ${mediaError || 'Permission denied'}`;
      case 'audio_only': return '🎤 Audio only mode';
      case 'connection_error': return '⚠️ Connection error - Trying to reconnect';
      case 'retrying': return 'Retrying...';
      case 'requesting_media': return 'Requesting camera access...';
      case 'https_required': return '⚠️ Please use HTTPS for camera access';
      default: return status;
    }
  };

  // Auto-reconnect on connection error
  useEffect(() => {
    if (status === 'connection_error' && socket) {
      const timer = setTimeout(() => {
        if (partnerId) {
          initPeerConnection(partnerId);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, partnerId, socket]);

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

        {(status === 'media_error' || status === 'https_required') && (
          <button
            onClick={handleRetryMedia}
            className="retry-btn"
          >
            Retry Camera
          </button>
        )}
      </div>

      {(status === 'media_error' || status === 'https_required') && (
        <div className="permission-help">
          <h3>Camera Access Required</h3>
          <p>To use this app, you need to allow camera access:</p>
          <ul>
            <li>Click the camera icon in your browser's address bar</li>
            <li>Select "Always allow" for camera and microphone access</li>
            <li>Refresh the page after granting permissions</li>
          </ul>
          <p>If you don't see the permission prompt, try these steps:</p>
          <ul>
            <li>Check your browser settings for camera permissions</li>
            <li>Ensure no other application is using your camera</li>
            <li>Try restarting your browser</li>
            <li>Use Chrome or Firefox for best compatibility</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoChat;