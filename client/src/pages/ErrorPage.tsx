// Error Page - Dedicated error page for 500-level errors
// Used as fallback for Error Boundary and route-level failures

import { useNavigate } from 'react-router-dom';

export const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div>
        <div className="error-page-code">
          500
        </div>
        <h1 className="error-page-title">
          Server Error
        </h1>
        <p className="error-page-message">
          Something went wrong on our end. Our team has been notified and we're working to fix the issue.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};
