// FeaturesSection Component
// Displays the core features of EduTool in a responsive grid layout

import React from 'react';
import FeatureCard from '../FeatureCard/FeatureCard';

const FeaturesSection: React.FC = () => {
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

  return (
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
  );
};

export default FeaturesSection;
