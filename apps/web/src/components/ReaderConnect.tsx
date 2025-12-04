'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';

export function ReaderConnect() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'unreachable'>('unknown');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('http://localhost:3010/health', { 
          cache: 'no-store',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStatus('ok');
          setMessage(data.status || 'Reader service healthy');
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('unreachable');
          // Suppress console errors for expected failure when service isn't running
          setMessage('Not running (optional)');
        }
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="mb-4 p-4 rounded-lg border" style={{
      borderColor: status === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)',
      background: status === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'
    }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">Desktop Passport Reader</div>
          <div className="text-sm" style={{ color: '#cbd5e1' }}>
            {status === 'ok' ? 'Connected to local reader service' : 'Local reader service not detected'}
          </div>
        </div>
        <div className="text-sm" style={{ color: '#94a3b8' }}>{message}</div>
      </div>
      {status !== 'ok' && (
        <div className="mt-2 text-xs" style={{ color: '#cbd5e1' }}>
          Start the reader on your desktop to enable NFC passport scanning. We will provide a helper at `services/passport-reader-service`.
        </div>
      )}
    </div>
  );
}
