import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiBriefcase, FiUserCheck, FiHelpCircle, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const passwordRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One lowercase letter', regex: /[a-z]/ },
  { label: 'One number', regex: /\d/ },
  { label: 'One special character (!@#$%^&*(),.?":{}|<>)', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name must be 100 characters or less';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (value.length < 7) return 'Phone number must be at least 7 digits';
        if (value.length > 15) return 'Phone number must be 15 digits or less';
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'company_name':
        if (role === 'broker' && value && value.length > 100) return 'Company name must be 100 characters or less';
        return '';
      default:
        return '';
    }
  };

  const checkPasswordRequirements = (password) => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole !== 'broker') {
      setFormData((prev) => ({ ...prev, company_name: '' }));
      setFieldErrors((prev) => ({ ...prev, company_name: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate all fields
    const newFieldErrors = {};
    Object.keys(formData).forEach((key) => {
      const fieldError = validateField(key, formData[key]);
      if (fieldError) newFieldErrors[key] = fieldError;
    });

    // Special check: company_name required for broker
    if (role === 'broker' && !formData.company_name.trim()) {
      newFieldErrors.company_name = 'Company name is required for brokers';
    }

    setFieldErrors(newFieldErrors);

    if (Object.values(newFieldErrors).some((err) => err)) {
      setError('Please fix the errors above');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      await register(submitData, role);
      setSuccess(`Registration successful as ${role}! Redirecting to login...`);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      // Check for field-specific errors from backend
      if (err.response?.data?.data) {
        const backendErrors = err.response.data.data;
        Object.keys(backendErrors).forEach((key) => {
          if (backendErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key] }));
          }
        });
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirementsMet = checkPasswordRequirements(formData.password);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center" aria-label="NestQuest Home">
          <span className="text-3xl font-bold text-blue-600">NestQuest</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3" role="alert">
              <FiAlertCircle className="flex-shrink-0 mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3" role="status">
              <FiCheckCircle className="flex-shrink-0 mt-0.5 h-5 w-5 text-green-600" aria-hidden="true" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Role Selector */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">Register as</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${role === 'user'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={() => handleRoleChange('user')}
                    className="sr-only"
                    aria-label="Register as User"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <FiUser className="h-8 w-8 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-900">User</span>
                    <span className="text-xs text-gray-500">Looking for a property</span>
                  </div>
                  <div className={`absolute inset-0 rounded-xl ${role === 'user' ? 'bg-blue-500/10' : ''}`} aria-hidden="true" />
                </label>

                <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${role === 'broker'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="role"
                    value="broker"
                    checked={role === 'broker'}
                    onChange={() => handleRoleChange('broker')}
                    className="sr-only"
                    aria-label="Register as Broker"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <FiBriefcase className="h-8 w-8 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-900">Broker</span>
                    <span className="text-xs text-gray-500">Listing properties</span>
                  </div>
                  <div className={`absolute inset-0 rounded-xl ${role === 'broker' ? 'bg-blue-500/10' : ''}`} aria-hidden="true" />
                </label>
              </div>
            </fieldset>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg transition-colors ${fieldErrors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="John Doe"
                  disabled={isLoading}
                  aria-invalid={fieldErrors.name ? 'true' : 'false'}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
              </div>
              {fieldErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg transition-colors ${fieldErrors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  aria-invalid={fieldErrors.email ? 'true' : 'false'}
                  aria-describedby={fieldErrors.email ? 'email-error' : 'email-hint'}
                />
              </div>
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.email}</p>
              ) : (
                <p id="email-hint" className="mt-1 text-xs text-gray-500">We'll never share your email.</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg transition-colors ${fieldErrors.phone
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="+91 98765 43210"
                  disabled={isLoading}
                  aria-invalid={fieldErrors.phone ? 'true' : 'false'}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
              </div>
              {fieldErrors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 rounded-lg transition-colors ${fieldErrors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Create a strong password"
                  disabled={isLoading}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.password}</p>
              ) : (
                <div id="password-hint" className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Password must include:</p>
                  <ul className="space-y-1" role="list" aria-label="Password requirements">
                    {passwordRequirementsMet.map((req, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        <span className={`flex-shrink-0 h-4 w-4 rounded border-2 ${req.met ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {req.met && <FiCheckCircle className="h-3 w-3 text-white" aria-hidden="true" />}
                        </span>
                        <span className={`${req.met ? 'text-green-700' : 'text-gray-500'}`}>{req.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg transition-colors ${fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Company Name (Broker only) */}
            {role === 'broker' && (
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  Company Name <span className="text-red-500">*</span>
                  <FiHelpCircle className="h-4 w-4 text-gray-400" aria-label="Your real estate company or agency name" />
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    autoComplete="organization"
                    required
                    value={formData.company_name}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-lg transition-colors ${fieldErrors.company_name
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    placeholder="E.g. Skyline Realty"
                    disabled={isLoading}
                    aria-invalid={fieldErrors.company_name ? 'true' : 'false'}
                    aria-describedby={fieldErrors.company_name ? 'company-error' : undefined}
                  />
                </div>
                {fieldErrors.company_name && (
                  <p id="company-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.company_name}</p>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <FiUserCheck className="h-5 w-5" aria-hidden="true" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <FiLogIn className="h-5 w-5 mr-2" aria-hidden="true" />
                Sign in instead
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}