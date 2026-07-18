import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

/**
 * The primary Admon mark. Next serves this as a PNG for browsers, Android,
 * crawlers, and any platform that does not support SVG favicons.
 */
export default function Icon() {
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
        <div
          style={{
            background: '#d95735',
            display: 'flex',
            height: 24,
            left: 74,
            position: 'absolute',
            top: 244,
            transform: 'rotate(-16deg)',
            width: 364,
          }}
        />
        <div
          style={{
            alignItems: 'center',
            background: '#d95735',
            borderRadius: 44,
            display: 'flex',
            height: 148,
            justifyContent: 'center',
            position: 'absolute',
            top: 164,
            transform: 'skewX(-14deg)',
            width: 336,
          }}
        >
          <div
            style={{
              background: '#dce7e4',
              borderRadius: 24,
              display: 'flex',
              height: 58,
              marginLeft: 36,
              marginTop: -30,
              width: 154,
            }}
          />
        </div>
        <div
          style={{
            background: '#112c3b',
            border: '16px solid #dce7e4',
            borderRadius: '50%',
            display: 'flex',
            height: 82,
            left: 116,
            position: 'absolute',
            top: 278,
            width: 82,
          }}
        />
        <div
          style={{
            background: '#112c3b',
            border: '16px solid #dce7e4',
            borderRadius: '50%',
            display: 'flex',
            height: 82,
            position: 'absolute',
            right: 116,
            top: 278,
            width: 82,
          }}
        />
        <div
          style={{
            background: '#dce7e4',
            borderRadius: 8,
            display: 'flex',
            height: 18,
            left: 178,
            position: 'absolute',
            top: 214,
            transform: 'rotate(-16deg)',
            width: 42,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
