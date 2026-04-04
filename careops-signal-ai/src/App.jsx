import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Activity, AlertCircle, Bell, Calendar, CheckCircle,
  Clock, Heart, Home, Phone, TrendingUp, Users, ChevronRight,
  AlertTriangle, Sparkles, UserPlus, Search, ArrowUpDown, LogOut, Trash2,
  FileText, Download, Eye, Menu, X, Shield, ClipboardList
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import { supabase } from './supabaseClient';
import { DEMO_PATIENTS, DEMO_ALERTS, DEMO_DASHBOARD, DEMO_CHECK_INS, DEMO_STAFF } from './demoData';

var API_URL = import.meta.env.VITE_API_URL || '';

function authFetch(url, options) {
  if (!options) options = {};
  return supabase.auth.getSession().then(function(result) {
    var session = result.data.session;
    var headers = Object.assign({}, options.headers, {
      Authorization: 'Bearer ' + (session ? session.access_token : '')
    });
    return fetch(url, Object.assign({}, options, { headers: headers }));
  });
}

function BetweenVisitsIcon({ size = 40 }) {
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

function DemoBanner() {
  var navigate = useNavigate();
  var { signOut } = useAuth();
  function handleExitDemo() {
    signOut().then(function() { navigate('/'); });
  }
  return (
    <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Eye size={18} />
        <span style={{ fontWeight: 500 }}>You are viewing a live demo</span>
        <span style={{ opacity: 0.85, fontSize: '0.85rem' }}> — Explore the full admin dashboard with sample patient data</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleExitDemo} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.375rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>Exit Demo</button>
        <button onClick={handleExitDemo} style={{ background: 'white', color: '#2563eb', border: 'none', padding: '0.375rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Sign Up Free</button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  var { user, demoMode, needsOnboarding, trialExpired } = useAuth();
  if (!user && !demoMode) return <Navigate to="/login" replace />;
  if (needsOnboarding && !demoMode) return <Navigate to="/onboarding" replace />;
  if (trialExpired && !demoMode) return <Navigate to="/trial-expired" replace />;
  return children;
}

// ==================== TRIAL EXPIRED SCREEN ====================
function TrialExpiredScreen() {
  var { user, signOut, trialEndsAt } = useAuth();
  var navigate = useNavigate();

  function handleSignOut() {
    signOut().then(function() { navigate('/'); });
  }

  var expiredDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', padding: '3rem', maxWidth: '520px', width: '100%', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Clock size={32} style={{ color: '#a16207' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.75rem' }}>Your trial has ended</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          Your 7-day free trial expired on {expiredDate}. Upgrade to a paid plan to continue using BetweenVisits and keep your patient data safe.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Signed in as {user ? user.email : ''}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Starter</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>$49/mo</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Up to 25 patients, 2 staff accounts</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'left', border: '2px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Professional</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>$99/mo</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Up to 100 patients, 10 staff, SMS alerts</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Enterprise</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>$199/mo</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Unlimited patients, unlimited staff, dedicated support</p>
          </div>
        </div>

        <button
          style={{
            width: '100%', padding: '0.875rem', marginTop: '1.5rem',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: 'white', border: 'none', borderRadius: '0.75rem',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Upgrade Now
        </button>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          Billing powered by Stripe (coming soon).
          <br />
          <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem', padding: 0, fontFamily: 'inherit' }}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== ONBOARDING SCREEN ====================
function OnboardingScreen() {
  var { user, refreshProfile } = useAuth();
  var navigate = useNavigate();
  var _agencyName = useState('');
  var agencyName = _agencyName[0], setAgencyName = _agencyName[1];
  var _firstName = useState('');
  var firstName = _firstName[0], setFirstName = _firstName[1];
  var _lastName = useState('');
  var lastName = _lastName[0], setLastName = _lastName[1];
  var _submitting = useState(false);
  var submitting = _submitting[0], setSubmitting = _submitting[1];
  var _error = useState(null);
  var error = _error[0], setError = _error[1];

  var handleSubmit = function(e) {
    e.preventDefault();
    if (!agencyName.trim()) { setError('Agency name is required'); return; }
    setSubmitting(true);
    setError(null);

    supabase.auth.getSession().then(function(result) {
      var session = result.data.session;
      return fetch(API_URL + '/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (session ? session.access_token : '')
        },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim()
        })
      });
    }).then(function(res) {
      if (!res.ok) return res.json().then(function(data) { throw new Error(data.error || 'Onboarding failed'); });
      return res.json();
    }).then(function() {
      return refreshProfile();
    }).then(function() {
      navigate('/dashboard');
    }).catch(function(err) {
      console.error('Onboarding failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', padding: '3rem', maxWidth: '500px', width: '100%', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BetweenVisitsIcon size={56} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginTop: '1rem', color: 'var(--text)' }}>Welcome to BetweenVisits</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Set up your agency to get started</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--red)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Agency Name *</label>
            <input
              type="text"
              value={agencyName}
              onChange={function(e) { setAgencyName(e.target.value); }}
              placeholder="e.g., Sunrise Home Care"
              required
              style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.9375rem', fontFamily: 'inherit', color: 'var(--text)' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Your First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={function(e) { setFirstName(e.target.value); }}
                placeholder="e.g., Sarah"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.9375rem', fontFamily: 'inherit', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Your Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={function(e) { setLastName(e.target.value); }}
                placeholder="e.g., Johnson"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.9375rem', fontFamily: 'inherit', color: 'var(--text)' }}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Signed in as {user ? user.email : ''}
          </p>
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit'
            }}
          >
            {submitting ? 'Setting up your agency...' : 'Create My Agency'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppShell() {
  var _sidebarOpen = useState(false);
  var sidebarOpen = _sidebarOpen[0], setSidebarOpen = _sidebarOpen[1];
  return (
    <div className="app">
      <button className="mobile-menu-btn" onClick={function() { setSidebarOpen(!sidebarOpen); }}>
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className={'sidebar-overlay ' + (sidebarOpen ? 'open' : '')} onClick={function() { setSidebarOpen(false); }} />
      <Sidebar isOpen={sidebarOpen} onClose={function() { setSidebarOpen(false); }} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/triage" element={<TriageQueue />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/check-in" element={<CheckInForm />} />
          <Route path="/new-patient" element={<NewPatientForm />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/trial-expired" element={<TrialExpiredScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </AuthProvider>
  );
}

function Sidebar({ isOpen, onClose }) {
  var { user, signOut, userRole, isAdmin, isCaregiver, isFamily, demoMode } = useAuth();
  var navigate = useNavigate();
  var allNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/triage', icon: AlertCircle, label: 'Triage Queue', badge: true, roles: ['admin', 'caregiver'] },
    { path: '/dashboard/patients', icon: Users, label: 'Patients', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/check-in', icon: CheckCircle, label: 'New Check-In', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/new-patient', icon: UserPlus, label: 'New Patient', roles: ['admin'] },
    { path: '/dashboard/staff', icon: Shield, label: 'Staff', roles: ['admin'] },
    { path: '/dashboard/reports', icon: FileText, label: 'Reports', roles: ['admin'] },
    { path: '/dashboard/audit-log', icon: ClipboardList, label: 'Audit Log', roles: ['admin'] },
  ];
  var navItems = allNavItems.filter(function(item) { return item.roles.includes(userRole); });
  var handleSignOut = function() { signOut().then(function() { navigate('/'); }); };
  var initials = user && user.email ? user.email[0].toUpperCase() : '?';
  var roleLabel = demoMode ? 'Demo Admin' : isAdmin ? 'Admin' : isCaregiver ? 'Caregiver' : isFamily ? 'Family' : 'User';

  return (
    <aside className={'sidebar ' + (isOpen ? 'open' : '')}>
      <div className="sidebar-header">
        <div className="logo">
          <BetweenVisitsIcon size={40} />
          <div>
            <h1 className="logo-title">BetweenVisits</h1>
            <p className="logo-subtitle">Early Warning System</p>
          </div>
        </div>
      </div>
      <nav className="nav">
        {navItems.map(function(item) {
          return (
            <Link key={item.path} to={item.path} className="nav-item" onClick={onClose}>
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge && <span className="badge">New</span>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.email : ''}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
          <button onClick={handleSignOut} title={demoMode ? 'Exit demo' : 'Sign out'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.25rem', flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ==================== DASHBOARD ====================
function Dashboard() {
  var { user, isAdmin, demoMode, agencyId } = useAuth();
  var effectiveAgencyId = agencyId;
  var _overview = useState(null); var overview = _overview[0], setOverview = _overview[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];

  useEffect(function() {
    if (demoMode) { setOverview(DEMO_DASHBOARD); setLoading(false); return; }
    if (!effectiveAgencyId) return;
    authFetch(API_URL + '/api/agencies/' + effectiveAgencyId + '/dashboard?days=7')
      .then(function(res) { return res.json(); })
      .then(function(data) { setOverview(data); setLoading(false); })
      .catch(function(err) { console.error('Failed to load dashboard:', err); setLoading(false); });
  }, [effectiveAgencyId, demoMode]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!overview) return <div className="error">Failed to load dashboard data</div>;

  var riskCounts = overview.riskDistribution ? overview.riskDistribution.reduce(function(acc, item) { acc[item.risk_level] = parseInt(item.count); return acc; }, {}) : {};
  var alertCounts = overview.pendingAlerts ? overview.pendingAlerts.reduce(function(acc, item) { acc[item.severity] = parseInt(item.count); return acc; }, {}) : {};

  return (
    <div className="dashboard">
      {demoMode && <DemoBanner />}
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time patient monitoring and alerts</p>
        </div>
        <div className="header-actions">
          {!demoMode && <Link to="/dashboard/check-in" className="btn-primary"><CheckCircle size={18} /> New Check-In</Link>}
        </div>
      </header>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue"><Users size={24} /></div><div className="stat-info"><span className="stat-value">{overview.totalPatients || 0}</span><span className="stat-label">Active Patients</span></div></div>
        <div className="stat-card"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-info"><span className="stat-value">{overview.recentCheckIns || 0}</span><span className="stat-label">Check-Ins (7d)</span></div></div>
        <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={24} /></div><div className="stat-info"><span className="stat-value">{alertCounts.critical || 0}</span><span className="stat-label">Critical Alerts</span></div></div>
        <div className="stat-card"><div className="stat-icon orange"><Activity size={24} /></div><div className="stat-info"><span className="stat-value">{alertCounts.warning || alertCounts.elevated || 0}</span><span className="stat-label">Warnings</span></div></div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Risk Distribution</h3>
          <div className="risk-bars">
            {['critical', 'elevated', 'moderate', 'routine'].map(function(level) {
              return (<div key={level} className="risk-bar-row"><span className={'risk-label ' + level}>{level}</span><div className="risk-bar-track"><div className={'risk-bar-fill ' + level} style={{ width: ((riskCounts[level] || 0) / (parseInt(overview.totalPatients) || 1)) * 100 + '%' }} /></div><span className="risk-count">{riskCounts[level] || 0}</span></div>);
            })}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/dashboard/triage" className="action-link"><AlertCircle size={20} /><span>View Triage Queue</span><ChevronRight size={16} /></Link>
            <Link to="/dashboard/patients" className="action-link"><Users size={20} /><span>Patient Directory</span><ChevronRight size={16} /></Link>
            {!demoMode && <Link to="/dashboard/check-in" className="action-link"><CheckCircle size={20} /><span>Submit Check-In</span><ChevronRight size={16} /></Link>}
            {isAdmin && !demoMode && <Link to="/dashboard/new-patient" className="action-link"><UserPlus size={20} /><span>Add New Patient</span><ChevronRight size={16} /></Link>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TRIAGE QUEUE ====================
function TriageQueue() {
  var { user, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var _alerts = useState([]); var alerts = _alerts[0], setAlerts = _alerts[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _resolvingId = useState(null); var resolvingId = _resolvingId[0], setResolvingId = _resolvingId[1];
  var _resolveNotes = useState(''); var resolveNotes = _resolveNotes[0], setResolveNotes = _resolveNotes[1];

  var loadAlerts = function() {
    if (demoMode) { setAlerts(DEMO_ALERTS); setLoading(false); return; }
    authFetch(API_URL + '/api/agencies/' + agencyId + '/triage-queue')
      .then(function(res) { return res.json(); })
      .then(function(data) { setAlerts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(function(err) { console.error('Failed to load triage queue:', err); setLoading(false); });
  };
  useEffect(function() { loadAlerts(); }, [agencyId, demoMode]);

  var handleAcknowledge = function(alertId) {
    if (demoMode) { alert('This is a demo - sign up for a free account to manage alerts!'); return; }
    authFetch(API_URL + '/api/alerts/' + alertId + '/acknowledge', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(function(res) { if (res.ok) loadAlerts(); });
  };
  var handleResolve = function(alertId) {
    if (demoMode) { alert('This is a demo - sign up for a free account to resolve alerts!'); return; }
    authFetch(API_URL + '/api/alerts/' + alertId + '/resolve', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolutionNotes: resolveNotes }) })
      .then(function(res) { if (res.ok) { setResolvingId(null); setResolveNotes(''); loadAlerts(); } });
  };

  if (loading) return <div className="loading">Loading triage queue...</div>;
  return (
    <div className="triage-queue">
      {demoMode && <DemoBanner />}
      <header className="page-header"><div><h1 className="page-title">Triage Queue</h1><p className="page-subtitle">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</p></div></header>
      {alerts.length === 0 ? (
        <div className="empty-state"><CheckCircle size={64} /><h2>All Clear</h2><p>No pending alerts. All patients are stable.</p></div>
      ) : (
        <div className="alerts-list">
          {alerts.map(function(al) {
            return (
              <div key={al.id} className={'alert-card ' + al.severity}>
                <div className="alert-header">
                  <div className="alert-patient">
                    <span className={'severity-dot ' + al.severity} />
                    <h3>{al.patient_name || (al.first_name + ' ' + al.last_name)}</h3>
                    <span className={'risk-badge ' + al.severity}>{al.severity}</span>
                    {al.status === 'acknowledged' && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 500, marginLeft: '0.5rem' }}>Acknowledged{al.assigned_to ? ' by ' + al.assigned_to : ''}</span>}
                  </div>
                  <span className="alert-time"><Clock size={14} />{new Date(al.created_at).toLocaleString()}</span>
                </div>
                <p className="alert-description">{al.description}</p>
                {al.ai_call_script && <div className="call-script"><h4><Phone size={16} /> Suggested Call Script</h4><p>{al.ai_call_script}</p></div>}
                {resolvingId === al.id ? (
                  <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Resolution Notes</label>
                    <textarea value={resolveNotes} onChange={function(e) { setResolveNotes(e.target.value); }} placeholder="Describe what action was taken..." rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={function() { handleResolve(al.id); }} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Confirm Resolved</button>
                      <button onClick={function() { setResolvingId(null); setResolveNotes(''); }} style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="alert-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Link to={'/dashboard/patients/' + al.patient_id} className="btn-secondary">View Details</Link>
                    {al.status === 'pending' && <button onClick={function() { handleAcknowledge(al.id); }} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Acknowledge</button>}
                    <button onClick={function() { setResolvingId(al.id); }} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>Resolve</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== PATIENT LIST ====================
function PatientList() {
  var { user, isAdmin, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var _patients = useState([]); var patients = _patients[0], setPatients = _patients[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _searchTerm = useState(''); var searchTerm = _searchTerm[0], setSearchTerm = _searchTerm[1];
  var _sortBy = useState('name'); var sortBy = _sortBy[0], setSortBy = _sortBy[1];

  useEffect(function() {
    if (demoMode) { setPatients(DEMO_PATIENTS); setLoading(false); return; }
    if (!agencyId) return;
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) { setPatients(data); setLoading(false); })
      .catch(function(err) { console.error('Failed to load patients:', err); setLoading(false); });
  }, [agencyId, demoMode]);

  if (loading) return <div className="loading">Loading patients...</div>;
  var riskPriority = { critical: 0, elevated: 1, moderate: 2, routine: 3 };
  var filtered = patients.filter(function(p) {
    var term = searchTerm.toLowerCase(); if (!term) return true;
    var fullName = (p.first_name + ' ' + p.last_name).toLowerCase();
    var conditions = Array.isArray(p.medical_conditions) ? p.medical_conditions.join(' ').toLowerCase() : '';
    return fullName.includes(term) || conditions.includes(term) || (p.caregiver_name || '').toLowerCase().includes(term);
  });
  var sorted = filtered.slice().sort(function(a, b) {
    if (sortBy === 'risk') return (riskPriority[a.risk_level] || 3) - (riskPriority[b.risk_level] || 3);
    if (sortBy === 'last-checkin') return (a.last_check_in ? new Date(a.last_check_in) : new Date(0)) - (b.last_check_in ? new Date(b.last_check_in) : new Date(0));
    return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name);
  });
  function timeAgo(dateStr) {
    if (!dateStr) return 'No check-ins yet';
    var diffMs = new Date() - new Date(dateStr); var diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return diffMins + 'm ago'; if (diffMins < 1440) return Math.floor(diffMins / 60) + 'h ago';
    var diffDays = Math.floor(diffMins / 1440); if (diffDays < 7) return diffDays + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="patient-list">
      {demoMode && <DemoBanner />}
      <header className="page-header">
        <div><h1 className="page-title">Patient Directory</h1><p className="page-subtitle">{patients.length} active patient{patients.length !== 1 ? 's' : ''}</p></div>
        {isAdmin && !demoMode && <Link to="/dashboard/new-patient" className="btn-primary"><UserPlus size={18} /> Add Patient</Link>}
      </header>
      <div className="list-controls">
        <div className="search-box"><Search size={18} /><input type="text" placeholder="Search patients, conditions, caregivers..." value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} /></div>
        <div className="sort-controls"><ArrowUpDown size={16} /><select value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}><option value="name">Sort by Name</option><option value="risk">Sort by Risk Level</option><option value="last-checkin">Sort by Last Check-In</option></select></div>
      </div>
      {sorted.length === 0 ? (
        <div className="empty-state"><Users size={48} /><h2>No patients found</h2><p>{searchTerm ? 'Try a different search term.' : 'Add your first patient to get started.'}</p></div>
      ) : (
        <div className="patient-grid">
          {sorted.map(function(patient) {
            return (
              <Link key={patient.id} to={'/dashboard/patients/' + patient.id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-avatar">{patient.first_name?.[0]}{patient.last_name?.[0]}</div>
                  <div><h3 className="patient-name">{patient.first_name} {patient.last_name}</h3><span className={'risk-badge ' + (patient.risk_level || 'routine')}>{patient.risk_level || 'routine'} risk</span></div>
                </div>
                <div className="patient-card-body">
                  {patient.medical_conditions && Array.isArray(patient.medical_conditions) && patient.medical_conditions.length > 0 && (
                    <div className="patient-conditions">
                      {patient.medical_conditions.slice(0, 3).map(function(c, i) { return <span key={i} className="condition-tag">{c}</span>; })}
                      {patient.medical_conditions.length > 3 && <span className="condition-tag more">+{patient.medical_conditions.length - 3}</span>}
                    </div>
                  )}
                  <div className="patient-meta">
                    <span><Calendar size={14} /> DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                    {patient.caregiver_name && <span><Heart size={14} /> {patient.caregiver_name}</span>}
                  </div>
                  <div className="patient-checkin-info">
                    <div className="checkin-stat"><Clock size={14} /><span className={'last-checkin ' + (!patient.last_check_in ? 'never' : '')}>{timeAgo(patient.last_check_in)}</span></div>
                    <div className="checkin-stat"><CheckCircle size={14} /><span>{patient.total_check_ins || 0} check-in{(parseInt(patient.total_check_ins) || 0) !== 1 ? 's' : ''}</span></div>
                  </div>
                </div>
                <div className="patient-card-footer"><span>View Details <ChevronRight size={16} /></span></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== PATIENT DETAIL ====================
function PatientDetail() {
  var { id } = useParams(); var navigate = useNavigate();
  var { isAdmin, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var _patient = useState(null); var patient = _patient[0], setPatient = _patient[1];
  var _checkIns = useState([]); var checkIns = _checkIns[0], setCheckIns = _checkIns[1];
  var _staffMembers = useState([]); var staffMembers = _staffMembers[0], setStaffMembers = _staffMembers[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _deleting = useState(false); var deleting = _deleting[0], setDeleting = _deleting[1];
  var _downloading = useState(false); var downloading = _downloading[0], setDownloading = _downloading[1];
  var _assigning = useState(false); var assigning = _assigning[0], setAssigning = _assigning[1];

  useEffect(function() {
    if (demoMode) {
      var dp = DEMO_PATIENTS.find(function(p) { return p.id === id; });
      setPatient(dp || null); setCheckIns(DEMO_CHECK_INS[id] || []); setStaffMembers(DEMO_STAFF); setLoading(false); return;
    }
    var promises = [
      authFetch(API_URL + '/api/patients/' + id).then(function(r) { return r.json(); }),
      authFetch(API_URL + '/api/patients/' + id + '/check-ins?limit=10').then(function(r) { return r.json(); })
    ];
    if (isAdmin) promises.push(authFetch(API_URL + '/api/agencies/' + agencyId + '/staff').then(function(r) { return r.json(); }));
    Promise.all(promises).then(function(results) {
      setPatient(results[0]); setCheckIns(Array.isArray(results[1]) ? results[1] : []);
      if (results[2]) setStaffMembers(Array.isArray(results[2]) ? results[2] : []);
      setLoading(false);
    }).catch(function(err) { console.error('Failed to load patient:', err); setLoading(false); });
  }, [id, demoMode]);

  var handleDelete = function() {
    if (demoMode) return;
    if (!window.confirm('Are you sure you want to delete ' + patient.first_name + ' ' + patient.last_name + '? This cannot be undone.')) return;
    setDeleting(true);
    authFetch(API_URL + '/api/patients/' + id, { method: 'DELETE' }).then(function(res) {
      if (!res.ok) throw new Error('Server returned ' + res.status); navigate('/dashboard/patients');
    }).catch(function(err) { console.error('Failed to delete:', err); alert('Failed to delete patient.'); setDeleting(false); });
  };
  var handleDownloadReport = function() {
    if (demoMode) { alert('This is a demo - sign up for a free account to generate PDF reports!'); return; }
    setDownloading(true);
    authFetch(API_URL + '/api/patients/' + id + '/report').then(function(res) {
      if (!res.ok) throw new Error('Failed'); return res.blob();
    }).then(function(blob) {
      var url = window.URL.createObjectURL(blob); var a = document.createElement('a');
      a.href = url; a.download = patient.first_name + '-' + patient.last_name + '-report.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url); setDownloading(false);
    }).catch(function(err) { console.error('Failed:', err); alert('Failed to generate report.'); setDownloading(false); });
  };
  var handleAssignCaregiver = function(caregiverId) {
    if (demoMode) return; setAssigning(true);
    authFetch(API_URL + '/api/patients/' + id + '/assign', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caregiverId: caregiverId || null }) })
      .then(function(res) { if (res.ok) return authFetch(API_URL + '/api/patients/' + id).then(function(r) { return r.json(); }); })
      .then(function(up) { if (up) setPatient(up); setAssigning(false); })
      .catch(function() { setAssigning(false); });
  };

  if (loading) return <div className="loading">Loading patient details...</div>;
  if (!patient) return <div className="error">Patient not found</div>;

  return (
    <div className="patient-detail">
      {demoMode && <DemoBanner />}
      <header className="page-header">
        <div>
          <h1 className="page-title">{patient.first_name} {patient.last_name}</h1>
          <span className={'risk-badge large ' + (patient.risk_level || 'routine')}>{patient.risk_level || 'routine'} risk</span>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadReport} disabled={downloading} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <Download size={18} />{downloading ? 'Generating...' : 'Download Report'}
          </button>
          {!demoMode && <Link to="/dashboard/check-in" className="btn-primary"><CheckCircle size={18} /> New Check-In</Link>}
          {isAdmin && !demoMode && (
            <button onClick={handleDelete} disabled={deleting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, opacity: deleting ? 0.6 : 1 }}>
              <Trash2 size={18} />{deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </header>
      <div className="patient-detail-grid">
        <div className="card patient-info-card">
          <h3 className="card-title">Patient Information</h3>
          <div className="info-grid">
            <div className="info-item"><span className="info-label">Date of Birth</span><span className="info-value">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</span></div>
            <div className="info-item"><span className="info-label">Caregiver Contact</span><span className="info-value">{patient.caregiver_name || 'Not assigned'}</span></div>
            <div className="info-item"><span className="info-label">Caregiver Phone</span><span className="info-value">{patient.caregiver_phone || 'N/A'}</span></div>
            <div className="info-item"><span className="info-label">Caregiver Email</span><span className="info-value">{patient.caregiver_email || 'N/A'}</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Assigned Staff Caregiver</h3>
          <div style={{ padding: '0.5rem 0' }}>
            {patient.assigned_first ? <p style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>Currently assigned to: {patient.assigned_first} {patient.assigned_last}</p> : <p style={{ margin: '0 0 0.75rem', color: '#64748b' }}>No staff caregiver assigned</p>}
            {isAdmin && !demoMode ? (
              <select value={patient.assigned_caregiver_id || ''} onChange={function(e) { handleAssignCaregiver(e.target.value); }} disabled={assigning} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
                <option value="">Unassigned</option>
                {staffMembers.map(function(s) { return <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>; })}
              </select>
            ) : <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{patient.assigned_first ? patient.assigned_first + ' ' + patient.assigned_last : 'Unassigned'}</p>}
          </div>
        </div>
        <div className="card"><h3 className="card-title">Medical Conditions</h3><div className="tags-list">{(Array.isArray(patient.medical_conditions) ? patient.medical_conditions : []).map(function(c, i) { return <span key={i} className="condition-tag">{c}</span>; })}</div></div>
        <div className="card"><h3 className="card-title">Medications</h3><div className="tags-list">{(Array.isArray(patient.medications) ? patient.medications : []).map(function(m, i) { return <span key={i} className="med-tag">{m}</span>; })}</div></div>
        <div className="card full-width">
          <h3 className="card-title">Recent Check-Ins</h3>
          {checkIns.length === 0 ? <p className="empty-message">No check-ins recorded yet.</p> : (
            <div className="check-in-history">
              {checkIns.map(function(ci) {
                return (
                  <div key={ci.id} className="check-in-item">
                    <div className="check-in-meta">
                      <span className="check-in-date"><Calendar size={14} />{new Date(ci.submitted_at).toLocaleString()}</span>
                      <span className="check-in-by">by {ci.submitted_by}</span>
                      {ci.risk_score && <span className={'risk-badge ' + (ci.risk_level || 'routine')}>Score: {ci.risk_score}</span>}
                    </div>
                    {ci.ai_summary && <p className="check-in-summary">{ci.ai_summary}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== REPORTS PAGE ====================
function ReportsPage() {
  var { isAdmin, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var _patients = useState([]); var patients = _patients[0], setPatients = _patients[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _reportType = useState('patient'); var reportType = _reportType[0], setReportType = _reportType[1];
  var _selectedPatient = useState(''); var selectedPatient = _selectedPatient[0], setSelectedPatient = _selectedPatient[1];
  var _startDate = useState(function() { var d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; });
  var startDate = _startDate[0], setStartDate = _startDate[1];
  var _endDate = useState(function() { return new Date().toISOString().split('T')[0]; });
  var endDate = _endDate[0], setEndDate = _endDate[1];
  var _downloading = useState(false); var downloading = _downloading[0], setDownloading = _downloading[1];

  useEffect(function() {
    if (demoMode) { setPatients(DEMO_PATIENTS); setLoading(false); return; }
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) { setPatients(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(function(err) { console.error('Failed to load patients:', err); setLoading(false); });
  }, [agencyId, demoMode]);

  var handleDownload = function() {
    if (demoMode) { alert('This is a demo - sign up for a free account to generate PDF reports!'); return; }
    if (reportType === 'patient' && !selectedPatient) { alert('Please select a patient.'); return; }
    setDownloading(true);
    var url = reportType === 'agency'
      ? API_URL + '/api/agencies/' + agencyId + '/report?start=' + startDate + '&end=' + endDate
      : API_URL + '/api/patients/' + selectedPatient + '/report?start=' + startDate + '&end=' + endDate;
    var pat = patients.find(function(p) { return p.id === selectedPatient; });
    var filename = reportType === 'agency' ? 'agency-weekly-report.pdf' : (pat ? pat.first_name + '-' + pat.last_name + '-report.pdf' : 'patient-report.pdf');
    authFetch(url).then(function(res) { if (!res.ok) throw new Error('Failed'); return res.blob(); })
      .then(function(blob) {
        var blobUrl = window.URL.createObjectURL(blob); var a = document.createElement('a');
        a.href = blobUrl; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(blobUrl); setDownloading(false);
      }).catch(function(err) { console.error('Failed:', err); alert('Failed to generate report.'); setDownloading(false); });
  };
  if (loading) return <div className="loading">Loading...</div>;
  return (
    <div className="check-in-form-page">
      {demoMode && <DemoBanner />}
      <header className="page-header"><div><h1 className="page-title">Reports</h1><p className="page-subtitle">Generate and download PDF reports</p></div></header>
      <div className="check-in-form">
        <div className="form-section"><h3>Report Type</h3><div className="form-row">
          <div className="form-group"><label><input type="radio" name="reportType" value="patient" checked={reportType === 'patient'} onChange={function() { setReportType('patient'); }} style={{ marginRight: '0.5rem' }} />Individual Patient Report</label><p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 1.5rem' }}>Detailed check-ins, risk scores, and alerts for one patient</p></div>
          <div className="form-group"><label><input type="radio" name="reportType" value="agency" checked={reportType === 'agency'} onChange={function() { setReportType('agency'); }} style={{ marginRight: '0.5rem' }} />Agency Weekly Summary</label><p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 1.5rem' }}>Overview of all patients, risk distribution, alerts, and trends</p></div>
        </div></div>
        {reportType === 'patient' && <div className="form-section"><h3>Select Patient</h3><div className="form-group"><label>Patient *</label><select value={selectedPatient} onChange={function(e) { setSelectedPatient(e.target.value); }}><option value="">Choose a patient...</option>{patients.map(function(p) { return <option key={p.id} value={p.id}>{p.first_name} {p.last_name} — {p.risk_level || 'routine'} risk</option>; })}</select></div></div>}
        <div className="form-section"><h3>Date Range</h3><div className="form-row">
          <div className="form-group"><label>Start Date</label><input type="date" value={startDate} onChange={function(e) { setStartDate(e.target.value); }} /></div>
          <div className="form-group"><label>End Date</label><input type="date" value={endDate} onChange={function(e) { setEndDate(e.target.value); }} /></div>
        </div></div>
        <div className="form-actions"><button onClick={handleDownload} className="btn-primary btn-large" disabled={downloading || (reportType === 'patient' && !selectedPatient)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Download size={20} />{downloading ? 'Generating PDF...' : reportType === 'agency' ? 'Download Agency Report' : 'Download Patient Report'}</button></div>
      </div>
    </div>
  );
}

// ==================== CHECK-IN FORM ====================
function CheckInForm() {
  var { user, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var _patients = useState([]); var patients = _patients[0], setPatients = _patients[1];
  var _submitting = useState(false); var submitting = _submitting[0], setSubmitting = _submitting[1];
  var _result = useState(null); var result = _result[0], setResult = _result[1];
  var _formData = useState({ patientId: '', submittedBy: '', painLevel: 0, painLocation: '', mobilityStatus: 'independent', moodStatus: 'normal', medicationsTaken: true, missedMedications: '', temperature: '', bloodPressure: '', heartRate: '', newSymptoms: '', fallIncident: false, catheterConcerns: false, woundConcerns: false, additionalNotes: '' });
  var formData = _formData[0], setFormData = _formData[1];

  useEffect(function() {
    if (demoMode) { setPatients(DEMO_PATIENTS); return; }
    if (!agencyId) return;
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) { setPatients(data); })
      .catch(function(err) { console.error('Failed to load patients:', err); });
  }, [agencyId, demoMode]);

  var handleSubmit = function(e) {
    e.preventDefault();
    if (demoMode) { alert('This is a demo - sign up for a free account to submit check-ins!'); return; }
    setSubmitting(true);
    var submitData = { patientId: formData.patientId, submittedBy: formData.submittedBy, painLevel: formData.painLevel, painLocation: formData.painLocation || null, mobilityStatus: formData.mobilityStatus, moodStatus: formData.moodStatus, medicationsTaken: formData.medicationsTaken,
      missedMedications: !formData.medicationsTaken && formData.missedMedications ? formData.missedMedications.split(',').map(function(m) { return m.trim(); }) : null,
      newSymptoms: formData.newSymptoms ? formData.newSymptoms.split(',').map(function(s) { return s.trim(); }) : null,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null, bloodPressure: formData.bloodPressure || null, heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
      fallIncident: formData.fallIncident, catheterConcerns: formData.catheterConcerns, woundConcerns: formData.woundConcerns, additionalNotes: formData.additionalNotes || null };
    authFetch(API_URL + '/api/check-ins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) })
      .then(function(res) { return res.json(); }).then(function(data) { setResult(data); setSubmitting(false); })
      .catch(function(err) { console.error('Failed to submit check-in:', err); setSubmitting(false); });
  };

  if (result) {
    return (
      <div className="check-in-result">
        <div className={'result-card ' + (result.riskScore?.level || 'routine')}>
          <CheckCircle size={64} /><h2>Check-In Recorded</h2><p className="result-message">{result.message}</p>
          <div className="result-details"><h3>Risk Assessment</h3>
            <div className="risk-score"><span className="score-value">{result.riskScore?.score || 0}/100</span><span className={'risk-badge large ' + (result.riskScore?.level || 'routine')}>{result.riskScore?.level || 'routine'}</span></div>
            {result.riskScore?.factors?.length > 0 && <div className="risk-factors"><h4>Detected Factors:</h4><ul>{result.riskScore.factors.map(function(f, i) { return <li key={i}>{f}</li>; })}</ul></div>}
          </div>
          <div className="result-actions"><button className="btn-primary" onClick={function() { setResult(null); }}>Submit Another Check-In</button>{result.alert && <Link to="/dashboard/triage" className="btn-secondary">View in Triage Queue</Link>}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="check-in-form-page">
      {demoMode && <DemoBanner />}
      <header className="page-header"><div><h1 className="page-title">Daily Check-In</h1><p className="page-subtitle">Record patient status and concerns</p></div></header>
      <form className="check-in-form" onSubmit={handleSubmit}>
        <div className="form-section"><h3>Patient Information</h3><div className="form-row">
          <div className="form-group"><label>Patient *</label><select value={formData.patientId} onChange={function(e) { setFormData(Object.assign({}, formData, { patientId: e.target.value })); }} required><option value="">Select patient...</option>{patients.map(function(p) { return <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>; })}</select></div>
          <div className="form-group"><label>Submitted by *</label><input type="text" value={formData.submittedBy} onChange={function(e) { setFormData(Object.assign({}, formData, { submittedBy: e.target.value })); }} placeholder="Your name or relationship" required /></div>
        </div></div>
        <div className="form-section"><h3>Pain &amp; Comfort</h3><div className="form-group"><label>Pain Level: {formData.painLevel}/10</label><input type="range" min="0" max="10" value={formData.painLevel} onChange={function(e) { setFormData(Object.assign({}, formData, { painLevel: parseInt(e.target.value) })); }} className="pain-slider" /></div>
          {formData.painLevel > 0 && <div className="form-group"><label>Pain Location</label><input type="text" value={formData.painLocation} onChange={function(e) { setFormData(Object.assign({}, formData, { painLocation: e.target.value })); }} placeholder="e.g., lower back, right knee" /></div>}
        </div>
        <div className="form-section"><h3>Mobility &amp; Mood</h3><div className="form-row">
          <div className="form-group"><label>Mobility Status</label><select value={formData.mobilityStatus} onChange={function(e) { setFormData(Object.assign({}, formData, { mobilityStatus: e.target.value })); }}><option value="independent">Independent</option><option value="assisted">Needs Assistance</option><option value="limited">Limited Mobility</option><option value="bedbound">Bedbound</option></select></div>
          <div className="form-group"><label>Mood</label><select value={formData.moodStatus} onChange={function(e) { setFormData(Object.assign({}, formData, { moodStatus: e.target.value })); }}><option value="normal">Normal / Stable</option><option value="anxious">Anxious</option><option value="agitated">Agitated</option><option value="confused">Confused</option><option value="depressed">Depressed</option><option value="distressed">Distressed</option></select></div>
        </div></div>
        <div className="form-section"><h3>Medications</h3><div className="form-group checkbox-group"><label><input type="checkbox" checked={formData.medicationsTaken} onChange={function(e) { setFormData(Object.assign({}, formData, { medicationsTaken: e.target.checked })); }} /> All medications taken as prescribed</label></div>
          {!formData.medicationsTaken && <div className="form-group"><label>Missed Medications (comma-separated)</label><input type="text" value={formData.missedMedications} onChange={function(e) { setFormData(Object.assign({}, formData, { missedMedications: e.target.value })); }} placeholder="e.g., Morning blood pressure med, Evening insulin" /></div>}
        </div>
        <div className="form-section"><h3>Vital Signs (if available)</h3><div className="form-row">
          <div className="form-group"><label>Temperature (degrees F)</label><input type="number" step="0.1" value={formData.temperature} onChange={function(e) { setFormData(Object.assign({}, formData, { temperature: e.target.value })); }} placeholder="98.6" /></div>
          <div className="form-group"><label>Blood Pressure</label><input type="text" value={formData.bloodPressure} onChange={function(e) { setFormData(Object.assign({}, formData, { bloodPressure: e.target.value })); }} placeholder="120/80" /></div>
          <div className="form-group"><label>Heart Rate (bpm)</label><input type="number" value={formData.heartRate} onChange={function(e) { setFormData(Object.assign({}, formData, { heartRate: e.target.value })); }} placeholder="72" /></div>
        </div></div>
        <div className="form-section"><h3>Concerns</h3><div className="form-group"><label>New Symptoms (comma-separated)</label><input type="text" value={formData.newSymptoms} onChange={function(e) { setFormData(Object.assign({}, formData, { newSymptoms: e.target.value })); }} placeholder="e.g., shortness of breath, swelling, dizziness" /></div>
          <div className="checkbox-grid">
            <label className="checkbox-label"><input type="checkbox" checked={formData.fallIncident} onChange={function(e) { setFormData(Object.assign({}, formData, { fallIncident: e.target.checked })); }} /> Fall incident</label>
            <label className="checkbox-label"><input type="checkbox" checked={formData.catheterConcerns} onChange={function(e) { setFormData(Object.assign({}, formData, { catheterConcerns: e.target.checked })); }} /> Catheter concerns</label>
            <label className="checkbox-label"><input type="checkbox" checked={formData.woundConcerns} onChange={function(e) { setFormData(Object.assign({}, formData, { woundConcerns: e.target.checked })); }} /> Wound concerns</label>
          </div>
        </div>
        <div className="form-section"><h3>Additional Notes</h3><div className="form-group"><textarea value={formData.additionalNotes} onChange={function(e) { setFormData(Object.assign({}, formData, { additionalNotes: e.target.value })); }} placeholder="Any other observations or concerns..." rows={4} /></div></div>
        <div className="form-actions"><button type="submit" className="btn-primary btn-large" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Check-In'}</button></div>
      </form>
    </div>
  );
}

// ==================== NEW PATIENT FORM ====================
function NewPatientForm() {
  var { user, demoMode, agencyId: authAgencyId } = useAuth();
  var agencyId = authAgencyId;
  var navigate = useNavigate();
  var _submitting = useState(false); var submitting = _submitting[0], setSubmitting = _submitting[1];
  var _error = useState(null); var error = _error[0], setError = _error[1];
  var _success = useState(null); var success = _success[0], setSuccess = _success[1];
  var _formData = useState({ firstName: '', lastName: '', dateOfBirth: '', medicalConditions: '', medications: '', caregiverName: '', caregiverPhone: '', caregiverEmail: '' });
  var formData = _formData[0], setFormData = _formData[1];

  var handleSubmit = function(e) {
    e.preventDefault();
    if (demoMode) { alert('This is a demo - sign up for a free account to add patients!'); return; }
    setSubmitting(true); setError(null);
    var payload = { agencyId: agencyId, firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), dateOfBirth: formData.dateOfBirth,
      medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map(function(c) { return c.trim(); }).filter(Boolean) : [],
      medications: formData.medications ? formData.medications.split(',').map(function(m) { return m.trim(); }).filter(Boolean) : [],
      caregiverName: formData.caregiverName.trim() || null, caregiverPhone: formData.caregiverPhone.trim() || null, caregiverEmail: formData.caregiverEmail.trim() || null };
    authFetch(API_URL + '/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function(res) { if (!res.ok) throw new Error('Server returned ' + res.status); return res.json(); })
      .then(function(data) { setSubmitting(false); setSuccess(data); })
      .catch(function(err) { setError(err.message || 'Failed to add patient.'); setSubmitting(false); });
  };

  if (success) {
    return (
      <div className="check-in-result"><div className="result-card routine"><CheckCircle size={64} /><h2>Patient Added Successfully</h2>
        <p className="result-message">{success.first_name || formData.firstName} {success.last_name || formData.lastName} has been added to your patient directory.</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={function() { setSuccess(null); setFormData({ firstName: '', lastName: '', dateOfBirth: '', medicalConditions: '', medications: '', caregiverName: '', caregiverPhone: '', caregiverEmail: '' }); }}>Add Another Patient</button>
          <Link to="/dashboard/patients" className="btn-secondary">View Patient Directory</Link>
        </div></div></div>
    );
  }
  return (
    <div className="check-in-form-page">
      <header className="page-header"><div><h1 className="page-title">Add New Patient</h1><p className="page-subtitle">Register a new patient for monitoring</p></div></header>
      {error && <div className="error-banner"><AlertTriangle size={18} /><span>{error}</span><button onClick={function() { setError(null); }}>&times;</button></div>}
      <form className="check-in-form" onSubmit={handleSubmit}>
        <div className="form-section"><h3>Patient Information</h3><div className="form-row">
          <div className="form-group"><label>First Name *</label><input type="text" value={formData.firstName} onChange={function(e) { setFormData(Object.assign({}, formData, { firstName: e.target.value })); }} placeholder="e.g., Margaret" required /></div>
          <div className="form-group"><label>Last Name *</label><input type="text" value={formData.lastName} onChange={function(e) { setFormData(Object.assign({}, formData, { lastName: e.target.value })); }} placeholder="e.g., Chen" required /></div>
        </div><div className="form-group"><label>Date of Birth *</label><input type="date" value={formData.dateOfBirth} onChange={function(e) { setFormData(Object.assign({}, formData, { dateOfBirth: e.target.value })); }} required /></div></div>
        <div className="form-section"><h3>Medical Information</h3>
          <div className="form-group"><label>Medical Conditions (comma-separated)</label><input type="text" value={formData.medicalConditions} onChange={function(e) { setFormData(Object.assign({}, formData, { medicalConditions: e.target.value })); }} placeholder="e.g., Type 2 Diabetes, Hypertension, Arthritis" /></div>
          <div className="form-group"><label>Medications (comma-separated)</label><input type="text" value={formData.medications} onChange={function(e) { setFormData(Object.assign({}, formData, { medications: e.target.value })); }} placeholder="e.g., Metformin 500mg, Lisinopril 10mg, Aspirin 81mg" /></div>
        </div>
        <div className="form-section"><h3>Caregiver Information</h3><div className="form-row">
          <div className="form-group"><label>Caregiver Name</label><input type="text" value={formData.caregiverName} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverName: e.target.value })); }} placeholder="e.g., Lisa Chen" /></div>
          <div className="form-group"><label>Caregiver Phone</label><input type="tel" value={formData.caregiverPhone} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverPhone: e.target.value })); }} placeholder="e.g., 555-0123" /></div>
        </div><div className="form-group"><label>Caregiver Email</label><input type="email" value={formData.caregiverEmail} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverEmail: e.target.value })); }} placeholder="e.g., lisa.chen@email.com" /></div></div>
        <div className="form-actions"><button type="submit" className="btn-primary btn-large" disabled={submitting}>{submitting ? 'Adding Patient...' : 'Add Patient'}</button></div>
      </form>
    </div>
  );
}

// ==================== STAFF MANAGEMENT ====================
function StaffManagement() {
  var { isAdmin, demoMode, agencyId } = useAuth();
  var _staff = useState([]); var staff = _staff[0], setStaff = _staff[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _showForm = useState(false); var showForm = _showForm[0], setShowForm = _showForm[1];
  var _submitting = useState(false); var submitting = _submitting[0], setSubmitting = _submitting[1];
  var _error = useState(null); var error = _error[0], setError = _error[1];
  var _success = useState(null); var success = _success[0], setSuccess = _success[1];
  var _formData = useState({ email: '', firstName: '', lastName: '', role: 'caregiver' });
  var formData = _formData[0], setFormData = _formData[1];

  function loadStaff() {
    if (demoMode) {
      setStaff(DEMO_STAFF);
      setLoading(false);
      return;
    }
    if (!agencyId) { setLoading(false); return; }
    authFetch(API_URL + '/api/agencies/' + agencyId + '/staff')
      .then(function(res) { return res.json(); })
      .then(function(data) { setStaff(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(function(err) { console.error('Failed to load staff:', err); setLoading(false); });
  }

  useEffect(function() { loadStaff(); }, [agencyId, demoMode]);

  var handleAddStaff = function(e) {
    e.preventDefault();
    if (demoMode) { alert('This is a demo - sign up for a free account to manage staff!'); return; }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    authFetch(API_URL + '/api/agencies/' + agencyId + '/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role
      })
    })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(data) { throw new Error(data.error || 'Failed to add staff'); });
        return res.json();
      })
      .then(function(data) {
        setSuccess(data.first_name + ' ' + data.last_name + ' has been added as ' + data.role + '. They can now sign up with ' + data.email + ' and will automatically join your agency.');
        setFormData({ email: '', firstName: '', lastName: '', role: 'caregiver' });
        setSubmitting(false);
        setShowForm(false);
        loadStaff();
      })
      .catch(function(err) {
        setError(err.message);
        setSubmitting(false);
      });
  };

  var handleRemoveStaff = function(staffId, name) {
    if (demoMode) { alert('This is a demo - sign up for a free account to manage staff!'); return; }
    if (!window.confirm('Remove ' + name + ' from your agency? They will lose access to all patient data.')) return;

    authFetch(API_URL + '/api/agencies/' + agencyId + '/staff/' + staffId, { method: 'DELETE' })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(data) { throw new Error(data.error || 'Failed to remove'); });
        loadStaff();
      })
      .catch(function(err) { alert(err.message); });
  };

  if (loading) return <div className="loading">Loading staff...</div>;

  return (
    <div className="patient-list">
      {demoMode && <DemoBanner />}
      <header className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        {!demoMode && (
          <button onClick={function() { setShowForm(!showForm); setError(null); setSuccess(null); }} className="btn-primary">
            <UserPlus size={18} />
            {showForm ? 'Cancel' : 'Add Staff Member'}
          </button>
        )}
      </header>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: 'var(--green)', fontSize: '0.9375rem' }}>
          <CheckCircle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          {success}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">Add Staff Member</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Add a team member to your agency. They will need to create a BetweenVisits account using the same email address to log in.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--red)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAddStaff}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" value={formData.firstName} onChange={function(e) { setFormData(Object.assign({}, formData, { firstName: e.target.value })); }} placeholder="e.g., Maria" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={formData.lastName} onChange={function(e) { setFormData(Object.assign({}, formData, { lastName: e.target.value })); }} placeholder="e.g., Santos" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" value={formData.email} onChange={function(e) { setFormData(Object.assign({}, formData, { email: e.target.value })); }} placeholder="e.g., maria@agency.com" required />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select value={formData.role} onChange={function(e) { setFormData(Object.assign({}, formData, { role: e.target.value })); }}>
                  <option value="caregiver">Caregiver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} />
              {submitting ? 'Adding...' : 'Add to Agency'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Team Members</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {staff.map(function(member) {
            return (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: member.role === 'admin' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                  {(member.first_name || '?')[0]}{(member.last_name || '')[0] || ''}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                    {member.first_name} {member.last_name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.email}
                  </div>
                </div>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: member.role === 'admin' ? '#ede9fe' : '#dbeafe', color: member.role === 'admin' ? '#7c3aed' : '#2563eb' }}>
                  {member.role}
                </span>
                {!demoMode && (
                  <button
                    onClick={function() { handleRemoveStaff(member.id, member.first_name + ' ' + member.last_name); }}
                    title="Remove staff member"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '0.25rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== AUDIT LOG PAGE ====================
function AuditLogPage() {
  var { demoMode, agencyId } = useAuth();
  var _entries = useState([]); var entries = _entries[0], setEntries = _entries[1];
  var _loading = useState(true); var loading = _loading[0], setLoading = _loading[1];
  var _total = useState(0); var total = _total[0], setTotal = _total[1];
  var _page = useState(0); var page = _page[0], setPage = _page[1];
  var pageSize = 25;

  function loadLog(offset) {
    if (demoMode) {
      setEntries([
        { id: 'demo-audit-1', action: 'view_patient', resource_type: 'patient', first_name: 'Demo', last_name: 'Admin', user_email: 'demo@betweenvisits.com', created_at: new Date(Date.now() - 300000).toISOString(), ip_address: '192.168.1.1', details: '{"email":"demo@betweenvisits.com"}' },
        { id: 'demo-audit-2', action: 'view_triage_queue', resource_type: 'agency', first_name: 'Demo', last_name: 'Admin', user_email: 'demo@betweenvisits.com', created_at: new Date(Date.now() - 600000).toISOString(), ip_address: '192.168.1.1', details: '{"email":"demo@betweenvisits.com","alertCount":4}' },
        { id: 'demo-audit-3', action: 'create_patient', resource_type: 'patient', first_name: 'Demo', last_name: 'Admin', user_email: 'demo@betweenvisits.com', created_at: new Date(Date.now() - 3600000).toISOString(), ip_address: '192.168.1.1', details: '{"email":"demo@betweenvisits.com","name":"Harold Thompson"}' },
        { id: 'demo-audit-4', action: 'download_patient_report', resource_type: 'patient', first_name: 'Maria', last_name: 'Santos', user_email: 'maria@betweenvisits.com', created_at: new Date(Date.now() - 7200000).toISOString(), ip_address: '10.0.0.5', details: '{"email":"maria@betweenvisits.com"}' },
        { id: 'demo-audit-5', action: 'acknowledge_alert', resource_type: 'alert', first_name: 'Maria', last_name: 'Santos', user_email: 'maria@betweenvisits.com', created_at: new Date(Date.now() - 10800000).toISOString(), ip_address: '10.0.0.5', details: '{"email":"maria@betweenvisits.com"}' }
      ]);
      setTotal(5);
      setLoading(false);
      return;
    }
    if (!agencyId) { setLoading(false); return; }
    authFetch(API_URL + '/api/agencies/' + agencyId + '/audit-log?limit=' + pageSize + '&offset=' + offset)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setEntries(data.entries || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(function(err) { console.error('Failed to load audit log:', err); setLoading(false); });
  }

  useEffect(function() { loadLog(page * pageSize); }, [agencyId, page, demoMode]);

  function formatAction(action) {
    var labels = {
      view_patient: 'Viewed patient',
      create_patient: 'Created patient',
      delete_patient: 'Deleted patient',
      assign_caregiver: 'Assigned caregiver',
      view_triage_queue: 'Viewed triage queue',
      acknowledge_alert: 'Acknowledged alert',
      resolve_alert: 'Resolved alert',
      download_patient_report: 'Downloaded patient report',
      download_agency_report: 'Downloaded agency report',
      add_staff: 'Added staff member',
      remove_staff: 'Removed staff member',
      agency_onboarding: 'Agency onboarded'
    };
    return labels[action] || action;
  }

  function actionColor(action) {
    if (action.includes('delete') || action.includes('remove')) return { bg: '#fef2f2', color: '#dc2626' };
    if (action.includes('create') || action.includes('add') || action.includes('onboarding')) return { bg: '#f0fdf4', color: '#16a34a' };
    if (action.includes('view') || action.includes('download')) return { bg: '#eff6ff', color: '#2563eb' };
    if (action.includes('acknowledge') || action.includes('resolve') || action.includes('assign')) return { bg: '#fefce8', color: '#a16207' };
    return { bg: '#f5f5f4', color: '#78716c' };
  }

  function timeAgo(dateStr) {
    var diffMs = new Date() - new Date(dateStr);
    var mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading) return <div className="loading">Loading audit log...</div>;

  var totalPages = Math.ceil(total / pageSize);

  return (
    <div className="patient-list">
      {demoMode && <DemoBanner />}
      <header className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">{total} recorded action{total !== 1 ? 's' : ''} — HIPAA compliance trail</p>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entries.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No audit entries yet. Actions will be logged as users interact with the system.</p>
          ) : entries.map(function(entry) {
            var colors = actionColor(entry.action);
            var details = null;
            try { details = entry.details ? JSON.parse(entry.details) : null; } catch(e) { details = null; }
            return (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, background: colors.bg, color: colors.color, whiteSpace: 'nowrap' }}>
                  {formatAction(entry.action)}
                </span>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                    {entry.first_name} {entry.last_name}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    {entry.user_email}
                  </span>
                </div>
                {details && details.name && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {details.name}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  {entry.ip_address && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {entry.ip_address}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={function() { setPage(Math.max(0, page - 1)); setLoading(true); }}
              disabled={page === 0}
              style={{ padding: '0.5rem 1rem', background: page === 0 ? 'var(--bg)' : 'white', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={function() { setPage(Math.min(totalPages - 1, page + 1)); setLoading(true); }}
              disabled={page >= totalPages - 1}
              style={{ padding: '0.5rem 1rem', background: page >= totalPages - 1 ? 'var(--bg)' : 'white', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
