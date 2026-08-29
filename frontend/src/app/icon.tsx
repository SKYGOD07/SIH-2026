import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1px',
            width: '22px',
            height: '22px',
          }}
        >
          {/* Row 0 */}
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />

          {/* Row 1 */}
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />

          {/* Row 2 */}
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFC400', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />

          {/* Row 3 */}
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />

          {/* Row 4 */}
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: 'transparent' }} />
          <div style={{ background: '#FFFFFF', borderRadius: '1px' }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
