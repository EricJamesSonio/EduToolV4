// NotFoundPage Component
// 404 page for unknown routes

import Button from '../components/Button';

const NotFoundPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="hero-title">
        Page Not Found
      </h1>
      <p className="page-description">
        The page you're looking for doesn't exist.
      </p>
      <Button variant="primary" onClick={() => window.location.href = '/'}>
        Back to Home
      </Button>
    </div>
  </div>
);

export default NotFoundPage;
