import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Activity, AlertCircle, CheckCircle, Shield, FileText,
  Bell, Users, ChevronRight, ArrowRight, Heart, Clock,
  Smartphone, BarChart3, Zap, X, Eye
} from 'lucide-react';
import './Landing.css';

function BetweenVisitsLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="#2563eb"/>
      <path d="M60 25C41.775 25 27 39.775 27 58C27 76.225 41.775 91 60 91C78.225 91 93 76.225 93 58C93 39.775 78.225 25 60 25Z" fill="none" stroke="white" strokeWidth="4"/>
      <path d="M60 38V58L72 70" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="60" cy="58" r="4" fill="white"/>
      <path d="M38 95L42 85" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 95L78 85" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
      <rect x="50" y="18" width="20" height="8" rx="3" fill="white"/>
    </svg>
  );
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  var score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#dc2626' };
  if (score <= 3) return { level: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { level: 3, label: 'Good', color: '#eab308' };
  if (score <= 5) return { level: 4, label: 'Strong', color: '#16a34a' };
  return { level: 5, label: 'Very Strong', color: '#059669' };
}

function LoginPanel({ isOpen, onClose }) {
  var { signIn, signUp } = useAuth();
  var navigate = useNavigate();
  var _mode = useState('login');
  var mode = _mode[0], setMode = _mode[1];
  var _email = useState('');
  var email = _email[0], setEmail = _email[1];
  var _password = useState('');
  var password = _password[0], setPassword = _password[1];
  var _loading = useState(false);
  var loading = _loading[0], setLoading = _loading[1];
  var _error = useState(null);
  var error = _error[0], setError = _error[1];
  var _message = useState(null);
  var message = _message[0], setMessage = _message[1];

  var strength = getPasswordStrength(password);

  var handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'login') {
      var result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } else {
      if (strength.level < 3) {
        setError('Password must be at least 10 characters with uppercase, lowercase, a number, and a special character.');
        setLoading(false);
        return;
      }
      var result2 = await signUp(email, password);
      if (result2.error) {
        setError(result2.error.message);
        setLoading(false);
      } else {
        setMessage('Account created! Check your email to confirm, then log in.');
        setMode('login');
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className={'login-overlay ' + (isOpen ? 'open' : '')} onClick={onClose} />
      <div className={'login-panel ' + (isOpen ? 'open' : '')}>
        <button className="login-panel-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="login-panel-content">
          <div className="login-logo">
            <BetweenVisitsLogo size={48} />
            <h2 className="login-title">BetweenVisits</h2>
            <p className="login-subtitle">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-success">{message}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                placeholder="you@agency.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                placeholder="--------"
                required
                minLength={mode === "signup" ? 10 : 1}
              />
              {mode === 'signup' && password.length > 0 && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map(function(i) {
                      return (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background: i <= strength.level ? strength.color : '#e2e8f0'
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {mode === 'signup' && (
                <p className="password-hint">Minimum 10 characters with uppercase, lowercase, number, and symbol</p>
              )}
            </div>



            <button
              type="submit"
              className="login-panel-btn"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="login-toggle">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={function() { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
              className="login-toggle-btn"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LandingPage() {
  var { user, startDemo } = useAuth();
  var navigate = useNavigate();
  var _searchParams = useSearchParams();
  var searchParams = _searchParams[0];
  var _loginOpen = useState(false);
  var loginOpen = _loginOpen[0], setLoginOpen = _loginOpen[1];

  useEffect(function() {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(function() {
    if (searchParams.get('login') !== null || window.location.pathname === '/login') {
      setLoginOpen(true);
    }
  }, [searchParams]);

  function handleTryDemo() {
    startDemo();
    navigate('/dashboard');
  }

  return (
    <div className="landing">
      <LoginPanel isOpen={loginOpen} onClose={function() { setLoginOpen(false); }} />

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <BetweenVisitsLogo size={36} />
            <span>BetweenVisits</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
            <button
              onClick={handleTryDemo}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <Eye size={16} />
              Try Demo
            </button>
            <button onClick={function() { setLoginOpen(true); }} className="landing-nav-cta">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Patient Safety</div>
          <h1>Catch Health Risks <span className="hero-highlight">Before</span> They Become Emergencies</h1>
          <p className="hero-subtitle">
            BetweenVisits monitors patient check-ins with AI-powered risk scoring,
            automatically alerting caregivers when something needs attention. Built for
            home care agencies and assisted living facilities.
          </p>
          <div className="hero-actions">
            <button onClick={function() { setLoginOpen(true); }} className="hero-btn-primary">
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button onClick={handleTryDemo} className="hero-btn-secondary" style={{ cursor: 'pointer', background: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} />
              Try Live Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">90/100</span>
              <span className="hero-stat-label">Risk scores in real-time</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">&lt; 30s</span>
              <span className="hero-stat-label">Alert delivery time</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">24/7</span>
              <span className="hero-stat-label">Continuous monitoring</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-inner">
          <div className="section-header">
            <h2>Everything You Need to Keep Patients Safe</h2>
            <p>A complete early warning system that connects caregivers, families, and care coordinators.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue"><CheckCircle size={28} /></div>
              <h3>Daily Check-Ins</h3>
              <p>Simple forms for caregivers and family members to report patient status - pain levels, mobility, medications, mood, and vitals.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple"><Zap size={28} /></div>
              <h3>AI Risk Scoring</h3>
              <p>Every check-in is analyzed by AI to calculate a risk score from 0-100, detecting patterns that humans might miss.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon red"><Bell size={28} /></div>
              <h3>Instant Alerts</h3>
              <p>When risk levels spike, caregivers are notified immediately via email and SMS with specific action recommendations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon green"><BarChart3 size={28} /></div>
              <h3>Triage Dashboard</h3>
              <p>A real-time command center showing risk distribution, pending alerts, and patient trends across your entire facility.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange"><FileText size={28} /></div>
              <h3>PDF Reports</h3>
              <p>Generate professional weekly reports per patient or agency-wide - perfect for doctor visits, family updates, or compliance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal"><Users size={28} /></div>
              <h3>Staff Management</h3>
              <p>Assign caregivers to patients, track who acknowledged and resolved alerts, and manage your care team efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="section-inner">
          <div className="section-header">
            <h2>How BetweenVisits Works</h2>
            <p>Three simple steps to safer patient care.</p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="step-number">1</div>
              <h3>Submit a Check-In</h3>
              <p>A caregiver or family member fills out a quick check-in form on their phone or computer - takes less than 2 minutes.</p>
            </div>
            <div className="how-arrow"><ChevronRight size={32} /></div>
            <div className="how-step">
              <div className="step-number">2</div>
              <h3>AI Analyzes Risk</h3>
              <p>Our AI engine scores the check-in, compares it against history, and identifies concerning patterns automatically.</p>
            </div>
            <div className="how-arrow"><ChevronRight size={32} /></div>
            <div className="how-step">
              <div className="step-number">3</div>
              <h3>Get Alerted Instantly</h3>
              <p>If risk is elevated or critical, the assigned caregiver receives an email and text with specific action recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="section-inner">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-tier">Starter</div>
              <div className="pricing-price">
                <span className="price-amount">$49</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-desc">Perfect for small home care agencies</p>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Up to 25 patients</li>
                <li><CheckCircle size={16} /> AI risk scoring</li>
                <li><CheckCircle size={16} /> Email alerts</li>
                <li><CheckCircle size={16} /> PDF reports</li>
                <li><CheckCircle size={16} /> 2 staff accounts</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Get Started</button>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-tier">Professional</div>
              <div className="pricing-price">
                <span className="price-amount">$99</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-desc">For growing agencies and assisted living facilities</p>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Up to 100 patients</li>
                <li><CheckCircle size={16} /> AI risk scoring</li>
                <li><CheckCircle size={16} /> Email + SMS alerts</li>
                <li><CheckCircle size={16} /> PDF reports</li>
                <li><CheckCircle size={16} /> 10 staff accounts</li>
                <li><CheckCircle size={16} /> Priority support</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn popular">Start Free Trial</button>
            </div>
            <div className="pricing-card">
              <div className="pricing-tier">Enterprise</div>
              <div className="pricing-price">
                <span className="price-amount">$199</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-desc">For large facilities and multi-location operations</p>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Unlimited patients</li>
                <li><CheckCircle size={16} /> AI risk scoring</li>
                <li><CheckCircle size={16} /> Email + SMS alerts</li>
                <li><CheckCircle size={16} /> PDF reports</li>
                <li><CheckCircle size={16} /> Unlimited staff accounts</li>
                <li><CheckCircle size={16} /> Dedicated support</li>
                <li><CheckCircle size={16} /> Custom integrations</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="section-inner">
          <h2>Ready to Protect Your Patients?</h2>
          <p>Join home care agencies and assisted living facilities using AI to catch health risks early.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={function() { setLoginOpen(true); }} className="hero-btn-primary">
              Start Your Free Trial <ArrowRight size={20} />
            </button>
            <button onClick={handleTryDemo} className="hero-btn-secondary" style={{ cursor: 'pointer', background: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} />
              Try Live Demo
            </button>
          </div>
        </div>
      </section>

      <section className="landing-contact" id="contact" style={{ padding: '4rem 2rem', background: '#f8fafc', textAlign: 'center' }}>
        <div className="section-inner">
          <div className="section-header">
            <h2>Get In Touch</h2>
            <p>Have questions or want a walkthrough? We would love to hear from you.</p>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <a href="mailto:batharbetweenvisits@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
              batharbetweenvisits@gmail.com
            </a>
            <p style={{ color: '#64748b', maxWidth: '500px', lineHeight: 1.6 }}>
              Whether you are a home care agency exploring BetweenVisits or have feedback to share, drop us an email and we will get back to you within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <BetweenVisitsLogo size={28} />
            <span>BetweenVisits</span>
          </div>
          <p className="footer-text">AI-powered early warning system for home care agencies and assisted living facilities.</p>
        </div>
      </footer>
    </div>
  );
}
