// HomePage Component
// Main landing page with hero section, features, testimonials, and stats

import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import FeatureCard from '../components/FeatureCard/FeatureCard';
import TestimonialCard from '../components/TestimonialCard/TestimonialCard';
import StatCard from '../components/StatCard/StatCard';

const HomePage = () => {
  const navigate = useNavigate();
  const features = [
    {
      title: 'Multi-Tenant Architecture',
      description: 'Scalable platform → organization → user model with isolated portals for each school. Perfect for managing multiple educational institutions.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&auto=format'
    },
    {
      title: 'Academic Management',
      description: 'Flexible structure with customizable programs, levels, sections, classes, and subjects. Adapts to any educational system.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format'
    },
    {
      title: 'Flexible Grading System',
      description: 'Configurable grading schemes, scales, and grade locks. Create reusable templates for consistent evaluation across programs.',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop&auto=format'
    },
    {
      title: 'Quick Setup & Data Seeder',
      description: 'Fast school configuration with predefined templates. Automatically generate programs, levels, and basic academic structure.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&auto=format'
    }
  ];

  const testimonials = [
    {
      quote: "EduTool has transformed how we manage our school. The multi-tenant architecture allows us to handle multiple campuses seamlessly.",
      author: "Sarah Johnson",
      role: "School Administrator",
      school: "Lincoln High School",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&auto=format"
    },
    {
      quote: "The grading system is incredibly flexible. I can customize schemes for different subjects and grade levels easily.",
      author: "Michael Chen",
      role: "Math Teacher",
      school: "Riverside Academy",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format"
    },
    {
      quote: "Setting up our new school was a breeze with the data seeder. What would have taken weeks took just a few hours.",
      author: "Emily Rodriguez",
      role: "Principal",
      school: "Future Tech School",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format"
    }
  ];

  const stats = [
    {
      label: "Total Users",
      value: 45678,
      icon: "👥",
      color: "primary" as const
    },
    {
      label: "School Administrators",
      value: 892,
      icon: "👨‍💼",
      color: "secondary" as const
    },
    {
      label: "Registered Schools",
      value: 234,
      icon: "🏫",
      color: "success" as const
    },
    {
      label: "Active Students",
      value: 38952,
      icon: "🎓",
      color: "warning" as const
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          {/* Main heading */}
          <h1 className="hero-title">
            The comprehensive school management system for modern education
          </h1>

          {/* Subheading */}
          <p className="hero-subtitle">
            Empower educational institutions with flexible academic structures, multi-tenant architecture, and scalable management tools. Transform your school administration today!
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              GET STARTED
            </Button>

            <Button variant="secondary" size="lg">
              I ALREADY HAVE AN ACCOUNT
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Integrated */}
      <section className="features-section">
        <div className="container">
          <h2 className="features-title">Features</h2>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                image={feature.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-container">
            <div className="testimonials-content-wrapper">
              <div className="testimonials-header">
                <h2 className="testimonials-title">Testimonials</h2>
              </div>
              <div className="testimonials-cards">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className={`testimonial-row ${index % 2 === 0 ? 'left' : 'right'}`}>
                    <div className="testimonial-text">
                      "{testimonial.quote}"
                    </div>
                    <TestimonialCard
                      author={testimonial.author}
                      role={testimonial.role}
                      school={testimonial.school}
                      avatar={testimonial.avatar}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <h2 className="stats-title">EduTool by the numbers</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
