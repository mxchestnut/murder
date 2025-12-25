import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { api } from '../utils/api';

interface PasswordRotationStatus {
  lastRotated: string | null;
  daysUntilRotation: number;
  needsRotation: boolean;
  overdue: boolean;
}

export default function PasswordRotationBanner() {
  const [status, setStatus] = useState<PasswordRotationStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadStatus();
    // Check every hour
    const interval = setInterval(loadStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await api.get('/system/password-rotation-status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to check password rotation status:', error);
    }
  };

  const handleConfirmRotation = async () => {
    if (!confirm('Have you rotated the AWS RDS database password in AWS Secrets Manager?')) {
      return;
    }

    setConfirming(true);
    try {
      await api.post('/system/record-password-rotation');
      alert('Password rotation recorded! Next rotation due in 90 days.');
      await loadStatus();
      setDismissed(true);
    } catch (error) {
      console.error('Failed to record rotation:', error);
      alert('Failed to record password rotation');
    } finally {
      setConfirming(false);
    }
  };

  if (!status || dismissed || (!status.needsRotation && !status.overdue)) {
    return null;
  }

  const isOverdue = status.overdue;
  const bgColor = isOverdue ? 'var(--accent-secondary)' : 'var(--accent-color)';
  const Icon = isOverdue ? AlertTriangle : CheckCircle;

  return (
    <div style={{
      background: bgColor,
      color: 'var(--text-primary)',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <Icon size={20} />
        <div>
          <strong>
            {isOverdue ? '⚠️ Database Password Rotation Overdue!' : '🔔 Database Password Rotation Needed'}
          </strong>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
            {isOverdue ? (
              `Password rotation is overdue by ${Math.abs(status.daysUntilRotation)} days. Please rotate immediately.`
            ) : (
              `Password rotation needed in ${status.daysUntilRotation} days. Rotate your AWS RDS password soon.`
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={handleConfirmRotation}
          disabled={confirming}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: confirming ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: confirming ? 0.6 : 1
          }}
        >
          {confirming ? 'Recording...' : 'I Rotated It'}
        </button>

        <a
          href="https://console.aws.amazon.com/rds/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Open AWS RDS Console
        </a>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
          title="Dismiss (will show again next time)"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
