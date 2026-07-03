// src/components/SignaturePad.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onChange: (data: { type: 'drawn' | 'typed'; value: string } | null) => void;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const sigRef = useRef<SignatureCanvas>(null);

  function handleDrawEnd() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      onChange(null);
      return;
    }
    const dataUrl = sigRef.current.toDataURL('image/png');
    onChange({ type: 'drawn', value: dataUrl });
  }

  function handleClear() {
    sigRef.current?.clear();
    onChange(null);
  }

  useEffect(() => {
    if (mode === 'type') {
      sigRef.current?.clear();
      onChange(typedName.trim() ? { type: 'typed', value: typedName.trim() } : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleTypedChange(value: string) {
    setTypedName(value);
    onChange(value.trim() ? { type: 'typed', value: value.trim() } : null);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setMode('draw')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid',
            borderColor: mode === 'draw' ? 'var(--sky-deep)' : 'var(--rust-line)',
            background: mode === 'draw' ? 'var(--sky-light)' : 'var(--surface)',
            color: mode === 'draw' ? 'var(--sky-deep)' : 'var(--text-mid)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ✍️ Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid',
            borderColor: mode === 'type' ? 'var(--sky-deep)' : 'var(--rust-line)',
            background: mode === 'type' ? 'var(--sky-light)' : 'var(--surface)',
            color: mode === 'type' ? 'var(--sky-deep)' : 'var(--text-mid)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ⌨️ Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <div
            style={{
              border: '1.5px dashed var(--rust-line)',
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <SignatureCanvas
              ref={sigRef}
              penColor="var(--ink)"
              canvasProps={{
                width: 400,
                height: 150,
                style: { width: '100%', height: 150, display: 'block' },
              }}
              onEnd={handleDrawEnd}
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'var(--text-mid)',
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
            }}
          >
            Clear and redo
          </button>
        </div>
      ) : (
        <input
          className="input-field"
          placeholder="Type your full name"
          value={typedName}
          onChange={(e) => handleTypedChange(e.target.value)}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontStyle: 'italic',
            padding: '20px 16px',
          }}
        />
      )}
    </div>
  );
}
