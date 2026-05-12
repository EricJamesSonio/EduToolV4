// DashboardPage Component
// User dashboard page

const DashboardPage = () => (
  <div className="home-page">
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Welcome to Admin Dashboard
        </h1>
        <p className="hero-subtitle">
          Dashboard coming soon!
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

export default DashboardPage;
