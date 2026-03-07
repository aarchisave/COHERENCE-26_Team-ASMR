import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let sharedSocket = null;

/**
 * useSocket — connects to the backend Socket.io server.
 * @param {Function} onUpdate  Called with the 'data:updated' payload on every live tick
 * @param {number}   debounceMs  Minimum ms between consecutive onUpdate calls (default 800)
 */
export default function useSocket(onUpdate, onTreasuryUpdate, debounceMs = 800) {
  const timerRef    = useRef(null);
  const callbackRef = useRef(onUpdate);
  const treasuryRef = useRef(onTreasuryUpdate);

  // Keep callback refs fresh
  useEffect(() => { 
    callbackRef.current = onUpdate; 
    treasuryRef.current = onTreasuryUpdate;
  }, [onUpdate, onTreasuryUpdate]);

  useEffect(() => {
    if (!sharedSocket) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      sharedSocket = io(socketUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      sharedSocket.on('connect', () => console.log('[Socket] connected', sharedSocket.id));
      sharedSocket.on('disconnect', () => console.log('[Socket] disconnected'));
    }

    function handleUpdate(payload) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current && callbackRef.current(payload);
      }, debounceMs);
    }

    function handleTreasury(payload) {
      treasuryRef.current && treasuryRef.current(payload);
    }

    sharedSocket.on('data:updated', handleUpdate);
    sharedSocket.on('treasury:sync', handleTreasury);

    return () => {
      sharedSocket.off('data:updated', handleUpdate);
      sharedSocket.off('treasury:sync', handleTreasury);
      clearTimeout(timerRef.current);
    };
  }, [debounceMs]);
}
