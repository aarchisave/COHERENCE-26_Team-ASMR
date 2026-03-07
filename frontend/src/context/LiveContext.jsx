import React, { createContext, useContext, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';

const LiveContext = createContext(null);

/**
 * LiveProvider — wraps the whole app, manages the live update counter
 * and last-updated timestamp. Individual pages subscribe via useLive().
 */
export function LiveProvider({ children }) {
  const [lastUpdate, setLastUpdate]         = useState(null);   // ISO timestamp
  const [updateCount, setUpdateCount]       = useState(0);      // total ticks received
  const [lastPayload, setLastPayload]       = useState(null);   // latest socket payload
  const [lastTreasuryUpdate, setLastTreasury] = useState(null);

  const handleUpdate = useCallback((payload) => {
    setLastUpdate(payload.timestamp);
    setUpdateCount(c => c + 1);
    setLastPayload(payload);
  }, []);

  const handleTreasury = useCallback((payload) => {
    setLastTreasury(payload);
  }, []);

  useSocket(handleUpdate, handleTreasury);

  return (
    <LiveContext.Provider value={{ lastUpdate, updateCount, lastPayload, lastTreasuryUpdate }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() { return useContext(LiveContext); }
