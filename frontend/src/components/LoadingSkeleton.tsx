import { CSSProperties } from 'react';

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
}

const LoadingSkeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  count = 1
}: LoadingSkeletonProps) => {
  const skeletonStyle: CSSProperties = {
    width,
    height,
    borderRadius,
    backgroundColor: '#e0e0e0',
    backgroundImage: 'linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} style={{ ...skeletonStyle, marginBottom: count > 1 ? '0.5rem' : '0' }} />
  ));

  return (
    <>
      {items}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
};

export default LoadingSkeleton;
