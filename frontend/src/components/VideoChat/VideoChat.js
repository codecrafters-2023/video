/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// /* eslint-disable no-unused-vars */
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useSocket } from '../../context/SocketContext';

// const VideoChat = () => {
//   const socket = useSocket();
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [status, setStatus] = useState('disconnected');
//   const [partnerId, setPartnerId] = useState(null);
//   const [roomId, setRoomId] = useState(null);
//   const [mediaError, setMediaError] = useState(null);
//   const peerRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));
//   const isInitiatorRef = useRef(false);
//   const connectionTimeoutRef = useRef(null);
//   const retryCountRef = useRef(0);
//   const lastPartnerIdRef = useRef(null);

//   // Initialize media with proper error handling
//   const initMedia = useCallback(async () => {
//     setStatus('requesting_media');
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: {
//           facingMode: 'user',
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         }
//       });

//       // Stop any existing stream
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }

//       localStreamRef.current = stream;
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       setMediaError(null);
//       setStatus('searching');

//       // If socket is available, join the queue
//       if (socket) {
//         socket.emit('join', userId.current);
//       }
//     } catch (err) {
//       console.error('Media access error:', err);
//       setMediaError(err.name);
//       setStatus('media_error');

//       // Try again without video if video fails
//       try {
//         const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

//         if (localStreamRef.current) {
//           localStreamRef.current.getTracks().forEach(track => track.stop());
//         }

//         localStreamRef.current = audioStream;
//         setStatus('audio_only');
//         setMediaError(null);

//         if (socket) {
//           socket.emit('join', userId.current);
//         }
//       } catch (audioErr) {
//         console.error('Audio-only access error:', audioErr);
//         setMediaError(audioErr.name);
//         setStatus('media_error');
//       }
//     }
//   }, [socket]);

//   // Initial media acquisition
//   useEffect(() => {
//     if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
//       setStatus('https_required');
//       return;
//     }

//     initMedia();

//     return () => {
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [initMedia]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (peerRef.current) {
//         peerRef.current.close();
//         peerRef.current = null;
//       }
//       if (connectionTimeoutRef.current) {
//         clearTimeout(connectionTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Initialize peer connection with native WebRTC
//   const initPeerConnection = (targetId, isInitiator) => {
//     // Reset retry count for new connection
//     retryCountRef.current = 0;
//     lastPartnerIdRef.current = targetId;

//     // Close previous connection if exists
//     if (peerRef.current) {
//       peerRef.current.close();
//       peerRef.current = null;
//     }

//     isInitiatorRef.current = isInitiator;

//     // Create RTCPeerConnection
//     const peer = new RTCPeerConnection({
//       iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' },
//         { urls: 'stun:stun3.l.google.com:19302' },
//         { urls: 'stun:stun4.l.google.com:19302' }
//       ]
//     });

//     // Add local stream
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         peer.addTrack(track, localStreamRef.current);
//       });
//     }

//     // Handle remote stream
//     peer.ontrack = (event) => {
//       console.log('Received remote stream');
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     // Handle ICE candidates
//     peer.onicecandidate = (event) => {
//       if (event.candidate && socket && targetId) {
//         console.log('Sending ICE candidate');
//         socket.emit('signal', {
//           to: targetId,
//           type: 'candidate',
//           candidate: event.candidate
//         });
//       }
//     };

//     peer.oniceconnectionstatechange = () => {
//       console.log(`ICE state: ${peer.iceConnectionState}`);
//       if (peer.iceConnectionState === 'connected') {
//         setStatus('connected');
//       }
//       else if (peer.iceConnectionState === 'failed' ||
//         peer.iceConnectionState === 'disconnected') {
//         setStatus('connection_error');
//       }
//     };

//     peer.onconnectionstatechange = () => {
//       console.log(`Connection state: ${peer.connectionState}`);
//       if (peer.connectionState === 'connected') {
//         setStatus('connected');
//         if (connectionTimeoutRef.current) {
//           clearTimeout(connectionTimeoutRef.current);
//           connectionTimeoutRef.current = null;
//         }
//       }
//       else if (peer.connectionState === 'disconnected' ||
//         peer.connectionState === 'failed') {
//         setStatus('connection_error');
//       }
//     };

//     // For initiator: create offer
//     if (isInitiator) {
//       console.log('Creating offer as initiator');
//       peer.createOffer({
//         offerToReceiveAudio: true,
//         offerToReceiveVideo: true
//       })
//         .then(offer => {
//           console.log('Offer created');
//           return peer.setLocalDescription(offer);
//         })
//         .then(() => {
//           console.log('Sending offer');
//           socket.emit('signal', {
//             to: targetId,
//             type: 'offer',
//             offer: peer.localDescription
//           });

//           // Set timeout for connection establishment
//           connectionTimeoutRef.current = setTimeout(() => {
//             if (peer.connectionState !== 'connected') {
//               console.log('Connection timed out');
//               setStatus('connection_timeout');
//               peer.close();
//             }
//           }, 15000); // 15 seconds timeout
//         })
//         .catch(err => {
//           console.error('Error creating offer:', err);
//           setStatus('connection_error');
//         });
//     }

//     peerRef.current = peer;
//   };

//   // Socket event handling
//   useEffect(() => {
//     if (!socket) return;

//     const handlePaired = ({ roomId, partnerId, isInitiator }) => {
//       console.log(`Paired with partner: ${partnerId}, Initiator: ${isInitiator}`);
//       setRoomId(roomId);
//       setPartnerId(partnerId);
//       setStatus('connected');
//       initPeerConnection(partnerId, isInitiator);
//     };

//     const handlePartnerDisconnected = () => {
//       console.log('Partner disconnected');
//       setStatus('partner_left');
//       setPartnerId(null);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//       if (peerRef.current) {
//         peerRef.current.close();
//         peerRef.current = null;
//       }
//       if (connectionTimeoutRef.current) {
//         clearTimeout(connectionTimeoutRef.current);
//         connectionTimeoutRef.current = null;
//       }
//     };

//     const handleSignal = (data) => {
//       console.log(`Received signal of type: ${data.type} from ${data.from}`);
//       if (!peerRef.current || !data.type) return;

//       switch (data.type) {
//         case 'offer':
//           console.log('Processing offer');
//           peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
//             .then(() => {
//               return peerRef.current.createAnswer({
//                 offerToReceiveAudio: true,
//                 offerToReceiveVideo: true
//               });
//             })
//             .then(answer => {
//               return peerRef.current.setLocalDescription(answer);
//             })
//             .then(() => {
//               console.log('Sending answer');
//               socket.emit('signal', {
//                 to: data.from,
//                 type: 'answer',
//                 answer: peerRef.current.localDescription
//               });

//               // Set timeout for connection establishment
//               connectionTimeoutRef.current = setTimeout(() => {
//                 if (peerRef.current.connectionState !== 'connected') {
//                   console.log('Connection timed out');
//                   setStatus('connection_timeout');
//                   peerRef.current.close();
//                 }
//               }, 15000); // 15 seconds timeout
//             })
//             .catch(err => {
//               console.error('Error handling offer:', err);
//               setStatus('connection_error');
//             });
//           break;

//         case 'answer':
//           console.log('Processing answer');
//           peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
//             .catch(err => {
//               console.error('Error setting answer:', err);
//               setStatus('connection_error');
//             });
//           break;

//         case 'candidate':
//           console.log('Processing ICE candidate');
//           peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
//             .catch(err => {
//               console.error('Error adding ICE candidate:', err);
//             });
//           break;

//         default:
//           console.warn('Unknown signal type:', data.type);
//       }
//     };

//     socket.on('paired', handlePaired);
//     socket.on('partner_disconnected', handlePartnerDisconnected);
//     socket.on('signal', handleSignal);

//     // Connection status
//     socket.on('connect', () => {
//       console.log('Socket connected');
//       if (status === 'disconnected') {
//         setStatus('searching');
//         if (localStreamRef.current) {
//           socket.emit('join', userId.current);  // Rejoin queue
//         }
//       }
//     });

//     socket.on('disconnect', () => {
//       console.log('Socket disconnected');
//       setStatus('disconnected');
//       fullCleanup();
//     });

//     socket.on('connect_error', (err) => {
//       console.error('Socket connection error:', err);
//       setStatus('connection_error');
//     });

//     return () => {
//       socket.off('paired', handlePaired);
//       socket.off('partner_disconnected', handlePartnerDisconnected);
//       socket.off('signal', handleSignal);
//       socket.off('connect');
//       socket.off('disconnect');
//       socket.off('connect_error');
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [socket, status]);

//   // Cleanup function for partner change
//   const fullCleanup = useCallback(() => {
//     console.log('Performing full cleanup');

//     if (peerRef.current) {
//       peerRef.current.close();
//       peerRef.current = null;
//     }

//     if (remoteVideoRef.current) {
//       remoteVideoRef.current.srcObject = null;
//     }

//     if (connectionTimeoutRef.current) {
//       clearTimeout(connectionTimeoutRef.current);
//       connectionTimeoutRef.current = null;
//     }

//     setPartnerId(null);
//     setRoomId(null);
//     setStatus('searching');
//   }, []);

//   const handleNextPartner = () => {
//     if (socket) {
//       console.log('Requesting next partner');
//       socket.emit('next');
//       fullCleanup();
//     }
//   };

//   const handleRetryMedia = useCallback(async () => {
//     setStatus('retrying');
//     fullCleanup();
//     try {
//       await initMedia();
//     } catch (err) {
//       setStatus('media_error');
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [initMedia]);

//   const getStatusMessage = () => {
//     switch (status) {
//       case 'disconnected': return 'Disconnected';
//       case 'searching': return '🔍 Searching for partner...';
//       case 'connected': return '✅ Connected to partner';
//       case 'partner_left': return '⚠️ Partner disconnected';
//       case 'media_error': return `❌ Media error: ${mediaError || 'Permission denied'}`;
//       case 'audio_only': return '🎤 Audio only mode';
//       case 'connection_error': return '⚠️ Connection error - Trying to reconnect';
//       case 'retrying': return 'Retrying...';
//       case 'requesting_media': return 'Requesting camera access...';
//       case 'https_required': return '⚠️ Please use HTTPS for camera access';
//       case 'connection_timeout': return '⚠️ Connection timed out - Retrying';
//       default: return status;
//     }
//   };

//   // Auto-reconnect on connection error with exponential backoff
//   useEffect(() => {
//     if (status === 'connection_error' || status === 'connection_timeout') {
//       if (retryCountRef.current < 3 && lastPartnerIdRef.current) {
//         const delay = Math.pow(2, retryCountRef.current) * 1000;
//         console.log(`Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1})`);

//         const timer = setTimeout(() => {
//           console.log('Attempting to reconnect');
//           initPeerConnection(lastPartnerIdRef.current, isInitiatorRef.current);
//           retryCountRef.current++;
//         }, delay);

//         return () => clearTimeout(timer);
//       } else if (retryCountRef.current >= 3) {
//         // After 3 retries, reset and search for new partner
//         console.log('Max retries reached, searching for new partner');
//         handleNextPartner();
//         retryCountRef.current = 0;
//       }
//     } else if (status === 'connected') {
//       // Reset retry count on successful connection
//       retryCountRef.current = 0;
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [status]);

//   return (
//     <div className="video-container">
//       <div className="status-bar">{getStatusMessage()}</div>

//       <div className="video-grid">
//         <div className="video-wrapper">
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             className={status === 'audio_only' ? 'audio-only' : ''}
//           />
//           <div className="video-label">You</div>
//         </div>

//         <div className="video-wrapper">
//           <video ref={remoteVideoRef} autoPlay playsInline />
//           <div className="video-label">Partner</div>
//         </div>
//       </div>

//       <div className="controls">
//         <button
//           onClick={handleNextPartner}
//           disabled={status !== 'connected' && status !== 'partner_left' && status !== 'connection_error' && status !== 'connection_timeout'}
//           className="next-btn"
//         >
//           Next Partner
//         </button>

//         {(status === 'media_error' || status === 'https_required') && (
//           <button
//             onClick={handleRetryMedia}
//             className="retry-btn"
//           >
//             Retry Camera
//           </button>
//         )}
//       </div>

//       {(status === 'media_error' || status === 'https_required') && (
//         <div className="permission-help">
//           <h3>Camera Access Required</h3>
//           <p>To use this app, you need to allow camera access:</p>
//           <ul>
//             <li>Click the camera icon in your browser's address bar</li>
//             <li>Select "Always allow" for camera and microphone access</li>
//             <li>Refresh the page after granting permissions</li>
//           </ul>
//           <p>If you don't see the permission prompt, try these steps:</p>
//           <ul>
//             <li>Check your browser settings for camera permissions</li>
//             <li>Ensure no other application is using your camera</li>
//             <li>Try restarting your browser</li>
//             <li>Use Chrome or Firefox for best compatibility</li>
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VideoChat;















import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import './VideoChat.css';

const VideoChat = () => {
  const socket = useSocket();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const [partnerId, setPartnerId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const userId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));
  const isInitiatorRef = useRef(false);
  const connectionTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const lastPartnerIdRef = useRef(null);

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
        // Ensure video plays
        localVideoRef.current.play().catch(e => console.log("Video play error:", e));
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

  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (socket && status === 'connected') {
        socket.emit('heartbeat');
      }
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [socket, status]);

  // Initial media acquisition
  useEffect(() => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setStatus('https_required');
      return;
    }

    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Initialize peer connection with native WebRTC
  const initPeerConnection = (targetId, isInitiator) => {
    // Reset retry count for new connection
    retryCountRef.current = 0;
    lastPartnerIdRef.current = targetId;

    // Close previous connection if exists
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
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
      console.log('Received remote stream', event.streams);
      if (event.streams && event.streams.length > 0) {
        // Use the first stream that has video tracks
        const videoStream = event.streams.find(stream =>
          stream.getVideoTracks().length > 0 || stream.getAudioTracks().length > 0
        );

        if (videoStream && remoteVideoRef.current) {
          console.log('Setting remote video source');
          remoteVideoRef.current.srcObject = videoStream;

          // Ensure the video plays
          remoteVideoRef.current.play().catch(e =>
            console.error("Remote video play error:", e)
          );
        }
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
        peer.iceConnectionState === 'disconnected') {
        setStatus('connection_error');
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`Connection state: ${peer.connectionState}`);
      if (peer.connectionState === 'connected') {
        setStatus('connected');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      }
      else if (peer.connectionState === 'disconnected' ||
        peer.connectionState === 'failed') {
        setStatus('connection_error');
      }
    };

    // For initiator: create offer
    if (isInitiator) {
      console.log('Creating offer as initiator');
      peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
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

          // Set timeout for connection establishment
          connectionTimeoutRef.current = setTimeout(() => {
            if (peer.connectionState !== 'connected') {
              console.log('Connection timed out');
              setStatus('connection_timeout');
              peer.close();
            }
          }, 15000); // 15 seconds timeout
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
      setStatus('connecting');
      initPeerConnection(partnerId, isInitiator);
      setMessages([]); // Clear previous messages when connecting to a new partner
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
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Add disconnect message to chat
      setMessages(prev => [...prev, {
        text: 'Partner has disconnected',
        sender: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    };

    const handleSignal = (data) => {
      console.log(`Received signal of type: ${data.type} from ${data.from}`);
      if (!peerRef.current || !data.type) return;

      switch (data.type) {
        case 'offer':
          console.log('Processing offer');
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => {
              return peerRef.current.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
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

              // Set timeout for connection establishment
              connectionTimeoutRef.current = setTimeout(() => {
                if (peerRef.current.connectionState !== 'connected') {
                  console.log('Connection timed out');
                  setStatus('connection_timeout');
                  peerRef.current.close();
                }
              }, 15000); // 15 seconds timeout
            })
            .catch(err => {
              console.error('Error handling offer:', err);
              setStatus('connection_error');
            });
          break;

        case 'answer':
          console.log('Processing answer');
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(() => {
              console.log('Remote description set successfully');
            })
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

        case 'chat':
          console.log('Received chat message:', data.message);
          setMessages(prev => [...prev, {
            text: data.message,
            sender: 'partner',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
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
      if (status === 'disconnected') {
        setStatus('searching');
        if (localStreamRef.current) {
          socket.emit('join', userId.current);  // Rejoin queue
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setStatus('disconnected');
      fullCleanup();
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

  // Cleanup function for partner change
  const fullCleanup = useCallback(() => {
    console.log('Performing full cleanup');

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    setPartnerId(null);
    setRoomId(null);
    setMessages([]);
    setStatus('searching');
  }, []);

  const handleNextPartner = () => {
    if (socket) {
      console.log('Requesting next partner');
      socket.emit('next');
      fullCleanup();
    }
  };

  const handleRetryMedia = useCallback(async () => {
    setStatus('retrying');
    fullCleanup();
    try {
      await initMedia();
    } catch (err) {
      setStatus('media_error');
    }
  }, [initMedia, fullCleanup]);

  // Refresh the connection
  const handleRefresh = () => {
    console.log('Refreshing connection');
    fullCleanup();
    if (socket) {
      socket.emit('join', userId.current);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (newMessage.trim() === '' || !partnerId) return;

    const messageData = {
      to: partnerId,
      type: 'chat',
      message: newMessage
    };

    socket.emit('signal', messageData);

    // Add to local messages
    setMessages(prev => [...prev, {
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setNewMessage('');
  };

  // Handle Enter key for chat
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusMessage = () => {
    switch (status) {
      case 'disconnected': return 'Disconnected';
      case 'searching': return '🔍 Searching for partner...';
      case 'connecting': return '🔄 Connecting to partner...';
      case 'connected': return '✅ Connected to partner';
      case 'partner_left': return '⚠️ Partner disconnected';
      case 'media_error': return `❌ Media error: ${mediaError || 'Permission denied'}`;
      case 'audio_only': return '🎤 Audio only mode';
      case 'connection_error': return '⚠️ Connection error - Trying to reconnect';
      case 'retrying': return 'Retrying...';
      case 'requesting_media': return 'Requesting camera access...';
      case 'https_required': return '⚠️ Please use HTTPS for camera access';
      case 'connection_timeout': return '⚠️ Connection timed out - Retrying';
      default: return status;
    }
  };

  // Auto-reconnect on connection error with exponential backoff
  useEffect(() => {
    if (status === 'connection_error' || status === 'connection_timeout') {
      if (retryCountRef.current < 3 && partnerId) { // ✅ Use current partnerId
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        const timer = setTimeout(() => {
          initPeerConnection(partnerId, isInitiatorRef.current);
          retryCountRef.current++;
        }, delay);
        return () => clearTimeout(timer);
      } else {
        handleNextPartner();
      }
    }
  }, [status, partnerId]);

  return (
    <div className="vc-container">
      <div className="vc-status-bar">{getStatusMessage()}</div>

      <div className="vc-main-content">
        <div className="vc-video-section">
          <div className="vc-video-grid">
            <div className="vc-video-wrapper">
              <div className="vc-video-container">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`vc-local-video ${status === 'audio_only' ? 'vc-audio-only' : ''}`}
                />
                <div className="vc-video-label">You</div>
                <div className="vc-video-overlay"></div>
              </div>
            </div>

            <div className="vc-video-wrapper">
              <div className="vc-video-container">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="vc-remote-video"
                />
                <div className="vc-video-label">Partner</div>
                <div className="vc-video-overlay"></div>
              </div>
            </div>
          </div>

          <div className="vc-controls">
            <button
              onClick={handleNextPartner}
              disabled={status !== 'connected' && status !== 'partner_left' && status !== 'connection_error' && status !== 'connection_timeout'}
              className="vc-control-btn vc-next-btn"
            >
              <span className="vc-btn-icon">⟳</span>
              <span className="vc-btn-text">Next Partner</span>
            </button>

            {(status === 'disconnected' || status === 'partner_left' || status === 'connection_error') && (
              <button
                onClick={handleRefresh}
                className="vc-control-btn vc-refresh-btn"
              >
                <span className="vc-btn-icon">↻</span>
                <span className="vc-btn-text">Refresh</span>
              </button>
            )}

            {(status === 'media_error' || status === 'https_required') && (
              <button
                onClick={handleRetryMedia}
                className="vc-control-btn vc-retry-btn"
              >
                <span className="vc-btn-icon">↻</span>
                <span className="vc-btn-text">Retry Camera</span>
              </button>
            )}
          </div>
        </div>

        <div className="vc-chat-section">
          <div className="vc-chat-panel">
            <div className="vc-chat-header">
              <h3>Chat</h3>
              <div className="vc-chat-status">
                {status === 'connected' ? (
                  <span className="vc-status-connected">● Connected</span>
                ) : (
                  <span className="vc-status-disconnected">● Disconnected</span>
                )}
              </div>
            </div>

            <div className="vc-messages-container">
              {messages.length === 0 ? (
                <div className="vc-no-messages">
                  <p>No messages yet</p>
                  <p>Say hello to your partner!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`vc-message ${msg.sender === 'me' ? 'vc-my-message' :
                      msg.sender === 'partner' ? 'vc-partner-message' : 'vc-system-message'}`}
                  >
                    <div className="vc-message-content">
                      <div className="vc-message-text">{msg.text}</div>
                      <div className="vc-message-time">{msg.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="vc-chat-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={status !== 'connected'}
              />
              <button
                onClick={sendMessage}
                disabled={newMessage.trim() === '' || status !== 'connected'}
                className="vc-send-btn"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {(status === 'media_error' || status === 'https_required') && (
        <div className="vc-help-section">
          <h3 className="vc-help-title">Camera Access Required</h3>
          <p className="vc-help-text">To use this app, you need to allow camera access:</p>
          <ul className="vc-help-list">
            <li className="vc-help-item">Click the camera icon in your browser's address bar</li>
            <li className="vc-help-item">Select "Always allow" for camera and microphone access</li>
            <li className="vc-help-item">Refresh the page after granting permissions</li>
          </ul>
          <p className="vc-help-text">If you don't see the permission prompt, try these steps:</p>
          <ul className="vc-help-list">
            <li className="vc-help-item">Check your browser settings for camera permissions</li>
            <li className="vc-help-item">Ensure no other application is using your camera</li>
            <li className="vc-help-item">Try restarting your browser</li>
            <li className="vc-help-item">Use Chrome or Firefox for best compatibility</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoChat;