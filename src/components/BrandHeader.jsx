import React from 'react';

export function BrandHeader({ onClick }) {
  return (
    <div style={{
      width: '100%',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E5E7EB',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <div 
        onClick={onClick}
        className="brand-logo"
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#1D4ED8',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'opacity 0.2s'
        }}
      >
        Groundwork
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: '300',
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: '90%',
        width: '600px',
        lineHeight: '1.4'
      }}>
        Strategize your uncertain high-stakes career conversations with grounded calmness and real-world practices.
      </div>
      <style>{`
        .brand-logo:hover { opacity: 0.7; }
      `}</style>
    </div>
  );
}

export default BrandHeader;
