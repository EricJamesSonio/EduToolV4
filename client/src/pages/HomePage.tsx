// HomePage Component
// Main landing page with hero section

const HomePage = () => {
  return (
    <div className="hero">
      <div className="hero-content">
        {/* Main heading */}
        <h1 className="hero-title">
          The free, fun, and effective way to learn a language!
        </h1>

        {/* Subheading */}
        <p className="hero-subtitle">
          Learn with EduTool and make your educational journey amazing. Join millions of learners and start your adventure today!
        </p>

        {/* CTA Buttons */}
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg">
            GET STARTED
          </button>

          <button className="btn btn-secondary btn-lg">
            I ALREADY HAVE AN ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
