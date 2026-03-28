import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertCircle, CheckCircle, Shield, FileText,
  Bell, Users, ChevronRight, ArrowRight, Heart, Clock,
  Smartphone, BarChart3, Zap
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

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="landing">
      {/* NAV */}
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
            <Link to="/login" className="landing-nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
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
            <Link to="/login" className="hero-btn-primary">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <a href="#how-it-works" className="hero-btn-secondary">
              See How It Works
            </a>
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

      {/* FEATURES */}
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
              <p>Simple forms for caregivers and family members to report patient status — pain levels, mobility, medications, mood, and vitals.</p>
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
              <p>Generate professional weekly reports per patient or agency-wide — perfect for doctor visits, family updates, or compliance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal"><Users size={28} /></div>
              <h3>Staff Management</h3>
              <p>Assign caregivers to patients, track who acknowledged and resolved alerts, and manage your care team efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
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
              <p>A caregiver or family member fills out a quick check-in form on their phone or computer — takes less than 2 minutes.</p>
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

      {/* PRICING */}
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
              <Link to="/login" className="pricing-btn">Get Started</Link>
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
              <Link to="/login" className="pricing-btn popular">Start Free Trial</Link>
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
              <Link to="/login" className="pricing-btn">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="section-inner">
          <h2>Ready to Protect Your Patients?</h2>
          <p>Join home care agencies and assisted living facilities using AI to catch health risks early.</p>
          <Link to="/login" className="hero-btn-primary">
            Start Your Free Trial <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
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
