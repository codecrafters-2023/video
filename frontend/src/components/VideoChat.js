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
  const peerRef = useRef(null); // Will hold RTCPeerConnection instance
  const localStreamRef = useRef(null);
  const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));
  const isInitiatorRef = useRef(false);

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

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setMediaError(null);
      setStatus('searching');

      if (socket) {
        socket.emit('join', userId.current);
      }
    } catch (err) {
      console.error('Media access error:', err);
      setMediaError(err.name);
      setStatus('media_error');

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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket && targetId) {
        socket.emit('signal', { 
          to: targetId, 
          type: 'candidate', 
          candidate: event.candidate 
        });
      }
    };
    
    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed' || 
          peer.iceConnectionState === 'disconnected' ||
          peer.iceConnectionState === 'closed') {
        setStatus('connection_error');
      }
    };
    
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setStatus('connected');
      }
    };
    
    // For initiator: create offer
    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
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
      setRoomId(roomId);
      setPartnerId(partnerId);
      setStatus('connected');
      initPeerConnection(partnerId, isInitiator);
    };

    const handlePartnerDisconnected = () => {
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
      if (!peerRef.current) return;
      
      switch (data.type) {
        case 'offer':
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => {
              return peerRef.current.createAnswer();
            })
            .then(answer => {
              return peerRef.current.setLocalDescription(answer);
            })
            .then(() => {
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
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            .catch(err => {
              console.error('Error setting answer:', err);
              setStatus('connection_error');
            });
          break;
          
        case 'candidate':
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

    return () => {
      socket.off('paired', handlePaired);
      socket.off('partner_disconnected', handlePartnerDisconnected);
      socket.off('signal', handleSignal);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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