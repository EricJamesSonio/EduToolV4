// AboutPage Component
// Comprehensive about page explaining EduTool platform

import Button from '@/components/Button';
import FeatureCard from './components/FeatureCard';

const AboutPage = () => (
  <div className="home-page">
    {/* Hero Section */}
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          About EduTool
        </h1>
        <p className="hero-subtitle">
          A modern multi-tenant SaaS platform transforming education management
        </p>
      </div>
    </section>

    {/* Content Sections */}
    <section className="features-section">
      <div className="container">
        <h2 className="features-title">Discover EduTool</h2>

        <div className="feature-grid">
          {/* What is this platform? */}
          <FeatureCard
            image="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop"
            title="What is EduTool?"
            description="EduTool is a modern multi-tenant SaaS school management and learning platform designed for schools, colleges, and academic institutions. It combines features from platforms like Google Classroom with advanced academic management, grading automation, and organization-level customization."
          />

          {/* Who is it for? */}
          <FeatureCard
            image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=200&h=200&fit=crop"
            title="Who is it For?"
            description="EduTool serves educational institutions of all types - from elementary schools to colleges and technical-vocational programs. It supports four key user roles: Platform Owners who manage the entire system, Admins who manage specific schools, Educators who handle classroom activities, and Students who participate in learning."
          />

          {/* Why was it made? */}
          <FeatureCard
            image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop"
            title="Why Was it Made?"
            description="EduTool was created to modernize educational workflows by providing a complete digital academic ecosystem. It aims to simplify both school administration and classroom learning while remaining flexible enough to adapt to different school structures and teaching approaches."
          />

          {/* What problem does it solve? */}
          <FeatureCard
            image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=200&fit=crop"
            title="What Problem Does it Solve?"
            description="EduTool addresses fragmented systems, manual grading processes, lack of integration between classroom and administration tools, and the difficulty of customizing academic structures. It provides a unified platform that eliminates data silos and reduces repetitive administrative work."
          />

          {/* What makes it different? */}
          <FeatureCard
            image="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&h=200&fit=crop"
            title="What Makes it Different?"
            description="EduTool stands out with its AI-powered assessment generator that reduces educator workload, multi-tenant architecture ensuring complete data isolation per organization, flexible and reusable grading schemes, and an organization seeder for fast onboarding. It scales from small schools to large institutions."
          />
        </div>

        {/* Additional Features Section */}
        <h2 className="features-title m-lg-8">Key Features</h2>

        <div className="feature-grid">
          <FeatureCard
            image="https://images.unsplash.com/photo-1588022443235-9e0f3b3c5c0e?w=200&h=200&fit=crop"
            title="Live Meetings"
            description="Conduct real-time online classes and discussions with virtual classroom sessions, scheduled live meetings, and student participation tracking."
          />

          <FeatureCard
            image="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop"
            title="Flexible Academic Structure"
            description="Fully customize programs, levels, sections, subjects, and academic terms. Support for different educational structures from elementary to college."
          />

          <FeatureCard
            image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop"
            title="Configurable Grading"
            description="Implement flexible grading schemes and scales that can be configured per program, level, subject, or institution. Support for percentage-based, GPA, and custom systems."
          />

          <FeatureCard
            image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop"
            title="AI Assessment Generator"
            description="Automatically generate quizzes, exams, assignments, and activities to reduce educator workload and speed up assessment creation while maintaining consistency."
          />

          <FeatureCard
            image="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=200&fit=crop"
            title="Reusable Templates"
            description="Reduce repetitive administrative work with reusable templates for grading schemes, grading scales, calendar templates, and academic configurations."
          />
        </div>

        {/* CTA Section */}
        <div className="text-center m-lg-8">
          <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
