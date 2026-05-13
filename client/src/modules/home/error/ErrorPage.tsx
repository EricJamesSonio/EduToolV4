// Error Page - Dedicated error page for 500-level errors
// Used as fallback for Error Boundary and route-level failures

import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';

export const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div>
        <div className="error-page-code">
          500
        </div>
        <h1 className="hero-title">
          Server Error
        </h1>
        <p className="error-page-message">
          Something went wrong on our end. Our team has been notified and we're working to fix the issue.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
