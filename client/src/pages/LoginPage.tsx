// LoginPage Component
// User authentication page with form validation

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../services/auth.service';
import { useErrorToast } from '../components/ErrorDisplay/UnifiedError';

const LoginPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useErrorToast();
  const loginMutation = useLogin();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: '',
    };

    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(formData, {
      onSuccess: () => {
        showSuccess('Login successful!');
        navigate('/dashboard');
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          showError('Invalid email or password');
        } else {
          showError(error instanceof Error ? error.message : 'Login failed');
        }
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="page-title">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--color-border-primary)',
                borderRadius: '12px',
                fontSize: '1rem',
              }}
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className="inline-error">
                {errors.email}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--color-border-primary)',
                borderRadius: '12px',
                fontSize: '1rem',
              }}
              placeholder="Enter your password"
            />
            {errors.password && (
              <div className="inline-error">
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="/" className="btn btn-secondary" style={{ display: 'inline-block' }}>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
