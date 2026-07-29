"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getAllTrackedEndpoints, getOverfetchWarnings, clearOverfetchWarnings } from "@/utils/detect-overfetch";
import { useState, useEffect } from "react";

export function DevDebugPanel() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [endpoints, setEndpoints] = useState<Array<{ endpoint: string; callsIn5s: number }>>([]);
  const [activeQueries, setActiveQueries] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setWarnings([...getOverfetchWarnings()]);
      setEndpoints(getAllTrackedEndpoints());
      setActiveQueries(queryClient.getQueryCache().getAll().length);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, queryClient]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
          background: '#1a1a2e', color: '#e94560', border: '1px solid #e94560',
          borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        API
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
        background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #333',
        borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace',
        maxWidth: 400, maxHeight: 400, overflow: 'auto', width: 360,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ color: '#e94560' }}>🔍 API Monitor</strong>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 6 }}>
        Cached queries: <span style={{ color: '#4ecca3' }}>{activeQueries}</span>
        {warnings.length > 0 && (
          <span style={{ marginLeft: 8 }}>
            | Warnings: <span style={{ color: '#e94560' }}>{warnings.length}</span>
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: '#e94560' }}>Overfetch Warnings:</strong>
            <button
              onClick={() => { clearOverfetchWarnings(); setWarnings([]); }}
              style={{ background: 'none', border: 'none', color: '#4ecca3', cursor: 'pointer', fontSize: 10 }}
            >
              clear
            </button>
          </div>
          {warnings.slice(-5).map((w, i) => (
            <div key={i} style={{ color: '#ff6b6b', marginTop: 2 }}>{w}</div>
          ))}
        </div>
      )}

      {endpoints.length > 0 && (
        <div>
          <strong style={{ color: '#4ecca3' }}>Active Endpoints:</strong>
          {endpoints.map((ep, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ep.endpoint}</span>
              <span style={{
                color: ep.callsIn5s > 3 ? '#e94560' : ep.callsIn5s > 1 ? '#ffd93d' : '#4ecca3',
                marginLeft: 8, fontWeight: 'bold',
              }}>
                {ep.callsIn5s}x
              </span>
            </div>
          ))}
        </div>
      )}

      {endpoints.length === 0 && warnings.length === 0 && (
        <div style={{ color: '#666' }}>No API activity detected yet.</div>
      )}
    </div>
  );
}
