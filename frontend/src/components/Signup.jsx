import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    setErrorMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.trim().length < 2) {
      newErrors.category = 'Category must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await userService.signup({
        email: formData.email.trim(),
        category: formData.category.trim(),
      });

      setSuccess(true);
      setFormData({ email: '', category: '' });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      if (error.response?.data?.error) {
        if (error.response.data.details) {
          // Validation errors from backend
          const backendErrors = {};
          error.response.data.details.forEach(detail => {
            if (detail.field === 'email') {
              backendErrors.email = detail.message;
            } else if (detail.field === 'category') {
              backendErrors.category = detail.message;
            }
          });
          setErrors(backendErrors);
        } else {
          setErrorMessage(error.response.data.error || error.response.data.message || 'Failed to sign up');
        }
      } else {
        setErrorMessage('Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Sign Up for Article Notifications</h2>
          <p>Get notified when new articles matching your interests are published</p>
        </div>

        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <div>
              <strong>Success!</strong>
              <p>You've been signed up successfully. You'll receive email notifications for articles matching your category.</p>
              <p className="redirect-message">Redirecting to home page...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category of Interest <span className="required">*</span>
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., ransomware, phishing, malware"
                className={errors.category ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.category && (
                <span className="error-text">{errors.category}</span>
              )}
              <small className="help-text">
                Enter a keyword or topic you're interested in. We'll notify you when articles match this category.
              </small>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="signup-footer">
          <p>
            Already signed up? <a href="/">Browse articles</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

