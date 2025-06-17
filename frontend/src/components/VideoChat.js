/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

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
  const isInitiatorRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  // Initialize media with proper error handling
  const initMedia = useCallback(async () => {
    setStatus('requesting_media');
    try {
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
        peerRef.current.close();
      }
      if (connectionTimeoutRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Initialize peer connection with native WebRTC
  const initPeerConnection = (targetId, isInitiator) => {
    if (peerRef.current) {
      peerRef.current.close();
    }
    
    isInitiatorRef.current = isInitiator;
    
    // Create RTCPeerConnection
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    });
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }
    
    // Handle remote stream
    peer.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket && targetId) {
        console.log('Sending ICE candidate');
        socket.emit('signal', { 
          to: targetId, 
          type: 'candidate', 
          candidate: event.candidate 
        });
      }
    };
    
    peer.oniceconnectionstatechange = () => {
      console.log(`ICE state: ${peer.iceConnectionState}`);
      if (peer.iceConnectionState === 'connected') {
        setStatus('connected');
      }
      else if (peer.iceConnectionState === 'failed' || 
               peer.iceConnectionState === 'disconnected' ||
               peer.iceConnectionState === 'closed') {
        setStatus('connection_error');
      }
    };
    
    // For initiator: create offer
    if (isInitiator) {
      console.log('Creating offer as initiator');
      peer.createOffer()
        .then(offer => {
          console.log('Offer created');
          return peer.setLocalDescription(offer);
        })
        .then(() => {
          console.log('Sending offer');
          socket.emit('signal', { 
            to: targetId, 
            type: 'offer', 
            offer: peer.localDescription 
          });
        })
        .catch(err => {
          console.error('Error creating offer:', err);
          setStatus('connection_error');
        });
    }
    
    peerRef.current = peer;
  };

  // Socket event handling
  useEffect(() => {
    if (!socket) return;

    const handlePaired = ({ roomId, partnerId, isInitiator }) => {
      console.log(`Paired with partner: ${partnerId}, Initiator: ${isInitiator}`);
      setRoomId(roomId);
      setPartnerId(partnerId);
      setStatus('connected');
      initPeerConnection(partnerId, isInitiator);
    };

    const handlePartnerDisconnected = () => {
      console.log('Partner disconnected');
      setStatus('partner_left');
      setPartnerId(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };

    const handleSignal = (data) => {
      console.log(`Received signal of type: ${data.type}`);
      if (!peerRef.current || !data.type) return;
      
      switch (data.type) {
        case 'offer':
          console.log('Processing offer');
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => {
              return peerRef.current.createAnswer();
            })
            .then(answer => {
              return peerRef.current.setLocalDescription(answer);
            })
            .then(() => {
              console.log('Sending answer');
              socket.emit('signal', { 
                to: data.from, 
                type: 'answer', 
                answer: peerRef.current.localDescription 
              });
            })
            .catch(err => {
              console.error('Error handling offer:', err);
              setStatus('connection_error');
            });
          break;
          
        case 'answer':
          console.log('Processing answer');
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            .catch(err => {
              console.error('Error setting answer:', err);
              setStatus('connection_error');
            });
          break;
          
        case 'candidate':
          console.log('Processing ICE candidate');
          peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(err => {
              console.error('Error adding ICE candidate:', err);
            });
          break;
          
        default:
          console.warn('Unknown signal type:', data.type);
      }
    };

    socket.on('paired', handlePaired);
    socket.on('partner_disconnected', handlePartnerDisconnected);
    socket.on('signal', handleSignal);

    // Connection status
    socket.on('connect', () => {
      console.log('Socket connected');
      setStatus('searching');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setStatus('disconnected');
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setStatus('connection_error');
    });

    return () => {
      socket.off('paired', handlePaired);
      socket.off('partner_disconnected', handlePartnerDisconnected);
      socket.off('signal', handleSignal);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  const handleNextPartner = () => {
    if (socket) {
      socket.emit('next');
      setStatus('searching');
      setPartnerId(null);
      setRoomId(null);
      
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
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
    if (status === 'connection_error' && socket && partnerId) {
      const timer = setTimeout(() => {
        console.log('Attempting to reconnect');
        initPeerConnection(partnerId, isInitiatorRef.current);
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