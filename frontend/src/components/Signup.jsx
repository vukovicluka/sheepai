import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    category: '',
    semanticQuery: '',
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

    // Category or semantic query validation (at least one required)
    const hasCategory = formData.category.trim().length > 0;
    const hasSemanticQuery = formData.semanticQuery.trim().length > 0;

    if (!hasCategory && !hasSemanticQuery) {
      newErrors.category = 'Either category or semantic query is required';
      newErrors.semanticQuery = 'Either category or semantic query is required';
    } else {
      if (hasCategory && formData.category.trim().length < 2) {
        newErrors.category = 'Category must be at least 2 characters';
      }
      if (hasSemanticQuery && formData.semanticQuery.trim().length < 3) {
        newErrors.semanticQuery = 'Semantic query must be at least 3 characters';
      }
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
      const signupData = {
        email: formData.email.trim(),
      };

      if (formData.category.trim()) {
        signupData.category = formData.category.trim();
      }

      if (formData.semanticQuery.trim()) {
        signupData.semanticQuery = formData.semanticQuery.trim();
      }

      const response = await userService.signup(signupData);

      setSuccess(true);
      setFormData({ email: '', category: '', semanticQuery: '' });

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
            } else if (detail.field === 'semanticQuery') {
              backendErrors.semanticQuery = detail.message;
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
                Category of Interest (Keyword-based)
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

            <div className="form-group">
              <label htmlFor="semanticQuery">
                Semantic Query (Meaning-based)
              </label>
              <input
                type="text"
                id="semanticQuery"
                name="semanticQuery"
                value={formData.semanticQuery}
                onChange={handleChange}
                placeholder="e.g., supply chain attacks, zero-day vulnerabilities"
                className={errors.semanticQuery ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.semanticQuery && (
                <span className="error-text">{errors.semanticQuery}</span>
              )}
              <small className="help-text">
                Enter a natural language query describing what you're interested in. We'll use semantic search to find articles matching the meaning, not just keywords.
              </small>
            </div>

            <div className="form-group">
              <small className="help-text" style={{ color: '#00ffff', fontStyle: 'italic' }}>
                <strong>Note:</strong> You can provide either a category keyword, a semantic query, or both. At least one is required.
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

