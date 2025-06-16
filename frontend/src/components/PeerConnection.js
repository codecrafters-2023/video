import { useEffect, useRef } from 'react';
import Peer from 'peerjs';

export default function usePeerConnection(localStream, remoteStreamRef, socket, partnerId) {
  const peerRef = useRef();
  const peerInstanceRef = useRef();

  useEffect(() => {
    if (!socket || !partnerId) return;

    const peer = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/peerjs',
      debug: 3
    });

    peer.on('open', (id) => {
      peerRef.current = id;
    });

    peer.on('call', (call) => {
      call.answer(localStream);
      call.on('stream', (remoteStream) => {
        remoteStreamRef.current.srcObject = remoteStream;
      });
    });

    const callPartner = () => {
      const call = peer.call(partnerId, localStream);
      call.on('stream', (remoteStream) => {
        remoteStreamRef.current.srcObject = remoteStream;
      });
    };

    // Initiate call after 1s delay
    const timer = setTimeout(callPartner, 1000);
    
    peerInstanceRef.current = peer;
    return () => {
      clearTimeout(timer);
      peer.destroy();
    };
  }, [socket, partnerId, localStream]);

  return peerRef;
}