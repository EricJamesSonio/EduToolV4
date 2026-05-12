// AboutPage Component
// About us page

import Button from '../components/Button';

const AboutPage = () => (
  <div className="home-page">
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          About Us
        </h1>
        <p className="hero-subtitle">
          About page coming soon!
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

export default AboutPage;
