// ThemePage Component
// Theme settings page

import Button from '@/components/Button';

const ThemePage = () => (
  <div className="home-page">
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Theme Settings
        </h1>
        <p className="hero-subtitle">
          Theme switcher coming soon!
        </p>
        <div className="hero-actions">
          <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default ThemePage;
