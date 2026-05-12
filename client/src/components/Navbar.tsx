// Navbar Component
// Navigation bar with language selector

import { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-brand">
        <div className="navbar-logo">
          ET
        </div>
        <span>EduTool</span>
      </div>

      {/* Desktop Navigation */}
      <ul className="navbar-nav desktop-nav">
        <li className="nav-item">
          <a href="/" className="nav-link">Home</a>
        </li>
        <li className="nav-item">
          <a href="/about" className="nav-link">About Us</a>
        </li>
        <li className="nav-item">
          <a href="/theme" className="nav-link">Theme</a>
        </li>
        <li className="nav-item">
          <a href="/login" className="nav-link">Sign In</a>
        </li>
      </ul>

      {/* Language Selector */}
      <div className="navbar-language">
        <button
          className="language-button"
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
        >
          <span>🇺🇸</span>
          <span>English</span>
          <span>▼</span>
        </button>

        {isLanguageOpen && (
          <div className="language-dropdown">
            <div className="language-option">
              <span>🇺🇸</span>
              <span>English</span>
            </div>
            <div className="language-option">
              <span>🇪🇸</span>
              <span>Spanish</span>
            </div>
            <div className="language-option">
              <span>🇫🇷</span>
              <span>French</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="navbar-toggle mobile-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
    </nav>
  );
};

export default Navbar;
