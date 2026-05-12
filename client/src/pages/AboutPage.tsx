// AboutPage Component
// About us page

import Button from '../components/Button';

const AboutPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="hero-title">
        About Us
      </h1>
      <p className="page-description">
        About page coming soon!
      </p>
      <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>
        Back to Home
      </Button>
    </div>
  </div>
);

export default AboutPage;
