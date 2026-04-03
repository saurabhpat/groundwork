import React from 'react';

export function BrandHeader() {
  return (
    <div style={{
      width: '100%',
      background: 'rgba(15, 15, 15, 0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(200, 184, 154, 0.1)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '500',
        color: '#C8B89A',
        letterSpacing: '0.2em',
        textTransform: 'uppercase'
      }}>
        Groundwork
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: '300',
        color: '#605850',
        textAlign: 'center',
        maxWidth: '600px',
        lineHeight: '1.4'
      }}>
        Strategize your uncertain high-stakes career conversations with grounded calmness and real-world practices.
      </div>
    </div>
  );
}

export default BrandHeader;
