// src/components/KodiStamp.tsx
//
// THE SIGNATURE ELEMENT.
// A circular badge showing the tenant's Kodi Score,
// styled like a stamp pressed into the page. Tilted
// slightly, dashed inner ring, color-coded by score band.

interface KodiStampProps {
  score: number;
  size?: number;
}

function bandColor(score: number) {
  if (score >= 850) return { ring: 'var(--sky-deep)', glow: 'var(--sky-light)' };
  if (score >= 700) return { ring: 'var(--sky-deep)', glow: 'var(--sky-light)' };
  if (score >= 500) return { ring: 'var(--pink-deep)', glow: 'var(--pink-light)' };
  return { ring: 'var(--danger)', glow: 'var(--danger-light)' };
}

export function KodiStamp({ score, size = 88 }: KodiStampProps) {
  const { ring } = bandColor(score);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${ring}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transform: 'rotate(-6deg)',
        position: 'relative',
        background: 'var(--surface)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          border: `1px dashed ${ring}`,
          opacity: 0.45,
        }}
      />
      <div
        className="display"
        style={{
          fontSize: size * 0.34,
          fontWeight: 700,
          color: ring,
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        {score}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 9,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: ring,
          marginTop: 2,
          opacity: 0.75,
        }}
      >
        Kodi
      </div>
    </div>
  );
}
