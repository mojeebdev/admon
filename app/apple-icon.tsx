import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

/** Apple home-screen icon, kept intentionally close to the primary mark. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#112c3b',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        <div style={{ background: '#d95735', height: 9, left: 26, position: 'absolute', top: 86, transform: 'rotate(-16deg)', width: 128 }} />
        <div style={{ background: '#d95735', borderRadius: 16, display: 'flex', height: 52, position: 'absolute', top: 58, transform: 'skewX(-14deg)', width: 118 }}>
          <div style={{ background: '#dce7e4', borderRadius: 8, height: 20, marginLeft: 48, marginTop: 9, width: 52 }} />
        </div>
        <div style={{ background: '#112c3b', border: '6px solid #dce7e4', borderRadius: '50%', height: 30, left: 41, position: 'absolute', top: 101, width: 30 }} />
        <div style={{ background: '#112c3b', border: '6px solid #dce7e4', borderRadius: '50%', height: 30, position: 'absolute', right: 41, top: 101, width: 30 }} />
      </div>
    ),
    { ...size },
  );
}
