// NotFoundPage Component
// 404 page for unknown routes

const NotFoundPage = () => (
  <div className="page">
    <div className="page-content">
      <h1 className="page-title">
        Page Not Found
      </h1>
      <p className="page-description">
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  </div>
);

export default NotFoundPage;
