import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ 
        backgroundColor: '#047b67',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Centered White Card - Exact Treeconomy match */}
      <div 
        className="w-full bg-white"
        style={{ 
          maxWidth: '440px',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <img
            src="/assets/img/URIMPACT_LOGO.png"
            alt="URIMPACT"
            style={{ height: '40px', width: 'auto' }}
          />
        </div>

        {/* Welcome Heading */}
        <h1 
          style={{ 
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.2',
            color: '#111827',
            textAlign: 'center',
            margin: '0 0 8px 0',
            fontFamily: 'inherit'
          }}
        >
          Welcome
        </h1>

        {/* Instruction Text */}
        <p 
          style={{ 
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#4b5563',
            textAlign: 'center',
            margin: '0 0 32px 0',
            fontFamily: 'inherit'
          }}
        >
          Log in using your account credentials
        </p>

        {/* Error message */}
        {error && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#991b1b', 
            borderRadius: '8px', 
            fontSize: '14px' 
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '8px',
                fontFamily: 'inherit'
              }}
            >
              Email address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#111827',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#047b67';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 123, 103, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '8px',
                fontFamily: 'inherit'
              }}
            >
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#047b67';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 123, 103, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href="#"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#047b67',
                textDecoration: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#036b5a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#047b67'}
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement forgot password functionality
              }}
            >
              Forgot password?
            </a>
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ 
              width: '100%',
              backgroundColor: '#047b67',
              color: '#ffffff',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              lineHeight: '1.5',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#036b5a';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#047b67';
            }}
          >
            {isLoading ? t('login.signingIn') : 'Continue'}
          </button>

          {/* Sign Up Link */}
          <div 
            style={{ 
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '4px',
              fontFamily: 'inherit'
            }}
          >
            Don't have an account?{' '}
            <a
              href="#"
              style={{
                fontWeight: '500',
                color: '#047b67',
                textDecoration: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#036b5a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#047b67'}
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement sign up navigation
              }}
            >
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

