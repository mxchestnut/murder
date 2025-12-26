import { CSSProperties } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
}

const LoadingSpinner = ({ size = 'md', color = '#9b59b6', message }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  const spinnerSize = sizes[size];

  const spinnerStyle: CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: `${spinnerSize / 10}px solid rgba(155, 89, 182, 0.2)`,
    borderTop: `${spinnerSize / 10}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {message && (
        <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
