import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLogin, useSignUp } from '../services/auth.service';
import { useErrorToast } from '../components/ErrorDisplay/ErrorDisplay';
import Button from '../components/Button';
import { getProfileApi } from '../api/auth.api';
import { getRoleHomePath } from '../types/auth';

type AuthMode = 'signin' | 'signup';

interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useErrorToast();
  const loginMutation = useLogin();
  const signUpMutation = useSignUp();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState<AuthFormState>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<keyof AuthFormState, string>>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const isSignUp = mode === 'signup';
  const isSubmitting = loginMutation.isPending || signUpMutation.isPending;

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): boolean => {
    const newErrors: Record<keyof AuthFormState, string> = {
      email: '',
      password: '',
      confirmPassword: '',
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

    if (isSignUp) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      email: formData.email.trim(),
      password: formData.password,
    };

    if (isSignUp) {
      signUpMutation.mutate(payload, {
        onSuccess: async () => {
          showSuccess('Account created successfully!');
          try {
            await navigateByRole();
          } catch {
            navigate('/');
          }
        },
        onError: (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            showError('Sign up is not available yet. Please contact your administrator.');
            return;
          }

          showError(error instanceof Error ? error.message : 'Sign up failed');
        },
      });
      return;
    }

    loginMutation.mutate(payload, {
      onSuccess: async () => {
        showSuccess('Login successful!');
        try {
          await navigateByRole();
        } catch {
          navigate('/');
        }
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          showError('Invalid email or password');
          return;
        }
        showError(error instanceof Error ? error.message : 'Login failed');
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrors({ email: '', password: '', confirmPassword: '' });
  };

  const navigateByRole = async () => {
    const profile = await getProfileApi();
    navigate(getRoleHomePath(profile.role));
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="hero-subtitle">
            {isSignUp
              ? 'Use your email and password to get started.'
              : 'Welcome back! Enter your credentials to continue.'}
          </p>

          <div className="hero-actions">
            <form onSubmit={handleSubmit} className="login-form auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                />
                {errors.email && <div className="inline-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                />
                {errors.password && <div className="inline-error">{errors.password}</div>}
              </div>

              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <div className="inline-error">{errors.confirmPassword}</div>}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
                {isSignUp ? (isSubmitting ? 'Creating account...' : 'Create Account') : (isSubmitting ? 'Signing in...' : 'Sign In')}
              </Button>
            </form>

            <p className="auth-switch">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
