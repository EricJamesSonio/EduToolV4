// ThemePage Component
// Theme settings page

import Button from '../components/Button';

const ThemePage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="hero-title">
        Theme Settings
      </h1>
      <p className="page-description">
        Theme switcher coming soon!
      </p>
      <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>
        Back to Home
      </Button>
    </div>
  </div>
);

export default ThemePage;
