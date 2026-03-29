import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Activity, AlertCircle, Bell, Calendar, CheckCircle,
  Clock, Heart, Home, Phone, TrendingUp, Users, ChevronRight,
  AlertTriangle, Sparkles, UserPlus, Search, ArrowUpDown, LogOut, Trash2,
  FileText, Download
} from 'lucide-react';
import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper: builds headers with Supabase JWT for authenticated API calls
async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session?.access_token}`,
  };
  return fetch(url, { ...options, headers });
}

// BetweenVisits logo SVG component
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

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <div className="app">
                <Sidebar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/triage" element={<TriageQueue />} />
                    <Route path="/patients" element={<PatientList />} />
                    <Route path="/patients/:id" element={<PatientDetail />} />
                    <Route path="/check-in" element={<CheckInForm />} />
                    <Route path="/new-patient" element={<NewPatientForm />} />
                    <Route path="/reports" element={<ReportsPage />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Sidebar() {
  const { user, signOut, userRole, isAdmin, isCaregiver, isFamily } = useAuth();
  const navigate = useNavigate();

  const allNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/triage', icon: AlertCircle, label: 'Triage Queue', badge: true, roles: ['admin', 'caregiver'] },
    { path: '/dashboard/patients', icon: Users, label: 'Patients', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/check-in', icon: CheckCircle, label: 'New Check-In', roles: ['admin', 'caregiver'] },
    { path: '/dashboard/new-patient', icon: UserPlus, label: 'New Patient', roles: ['admin'] },
    { path: '/dashboard/reports', icon: FileText, label: 'Reports', roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(function(item) {
    return item.roles.includes(userRole);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.email ? user.email[0].toUpperCase() : '?';
  const roleLabel = isAdmin ? 'Admin' : isCaregiver ? 'Caregiver' : isFamily ? 'Family' : 'User';

  return (
    <aside className="sidebar">
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
            <Link key={item.path} to={item.path} className="nav-item">
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
            <div className="user-name" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            <div className="user-role">{roleLabel}</div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.25rem', flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ==================== DASHBOARD ====================
function Dashboard() {
  const { user, isAdmin, isCaregiver, agencyId } = useAuth();
  const effectiveAgencyId = agencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!effectiveAgencyId) return;
    authFetch(API_URL + '/api/agencies/' + effectiveAgencyId + '/dashboard?days=7')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setOverview(data);
        setLoading(false);
      })
      .catch(function(err) {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, [effectiveAgencyId]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!overview) return <div className="error">Failed to load dashboard data</div>;

  const riskCounts = overview.riskDistribution ? overview.riskDistribution.reduce(function(acc, item) {
    acc[item.risk_level] = parseInt(item.count);
    return acc;
  }, {}) : {};

  const alertCounts = overview.pendingAlerts ? overview.pendingAlerts.reduce(function(acc, item) {
    acc[item.severity] = parseInt(item.count);
    return acc;
  }, {}) : {};

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time patient monitoring and alerts</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard/check-in" className="btn-primary">
            <CheckCircle size={18} />
            New Check-In
          </Link>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{overview.totalPatients || 0}</span>
            <span className="stat-label">Active Patients</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{overview.recentCheckIns || 0}</span>
            <span className="stat-label">Check-Ins (7d)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{alertCounts.critical || 0}</span>
            <span className="stat-label">Critical Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Activity size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{alertCounts.warning || 0}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Risk Distribution</h3>
          <div className="risk-bars">
            {['critical', 'elevated', 'moderate', 'routine'].map(function(level) {
              return (
                <div key={level} className="risk-bar-row">
                  <span className={'risk-label ' + level}>{level}</span>
                  <div className="risk-bar-track">
                    <div
                      className={'risk-bar-fill ' + level}
                      style={{ width: ((riskCounts[level] || 0) / (overview.totalPatients || 1)) * 100 + '%' }}
                    />
                  </div>
                  <span className="risk-count">{riskCounts[level] || 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/dashboard/triage" className="action-link">
              <AlertCircle size={20} />
              <span>View Triage Queue</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/dashboard/patients" className="action-link">
              <Users size={20} />
              <span>Patient Directory</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/dashboard/check-in" className="action-link">
              <CheckCircle size={20} />
              <span>Submit Check-In</span>
              <ChevronRight size={16} />
            </Link>
            {isAdmin && (
              <Link to="/dashboard/new-patient" className="action-link">
                <UserPlus size={20} />
                <span>Add New Patient</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TRIAGE QUEUE ====================
function TriageQueue() {
  const { user, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const loadAlerts = function() {
    authFetch(API_URL + '/api/agencies/' + agencyId + '/triage-queue')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(function(err) {
        console.error('Failed to load triage queue:', err);
        setLoading(false);
      });
  };

  useEffect(function() { if (agencyId) loadAlerts(); }, [agencyId]);

  const handleAcknowledge = async function(alertId) {
    try {
      const res = await authFetch(API_URL + '/api/alerts/' + alertId + '/acknowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async function(alertId) {
    try {
      const res = await authFetch(API_URL + '/api/alerts/' + alertId + '/resolve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: resolveNotes })
      });
      if (res.ok) {
        setResolvingId(null);
        setResolveNotes('');
        loadAlerts();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  if (loading) return <div className="loading">Loading triage queue...</div>;

  return (
    <div className="triage-queue">
      <header className="page-header">
        <div>
          <h1 className="page-title">Triage Queue</h1>
          <p className="page-subtitle">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      {alerts.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={64} />
          <h2>All Clear</h2>
          <p>No pending alerts. All patients are stable.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map(function(alert) {
            return (
              <div key={alert.id} className={'alert-card ' + alert.severity}>
                <div className="alert-header">
                  <div className="alert-patient">
                    <span className={'severity-dot ' + alert.severity} />
                    <h3>{alert.patient_name || (alert.first_name + ' ' + alert.last_name)}</h3>
                    <span className={'risk-badge ' + alert.severity}>{alert.severity}</span>
                    {alert.status === 'acknowledged' && (
                      <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 500, marginLeft: '0.5rem' }}>
                        Acknowledged{alert.assigned_to ? ' by ' + alert.assigned_to : ''}
                      </span>
                    )}
                  </div>
                  <span className="alert-time">
                    <Clock size={14} />
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="alert-description">{alert.description}</p>
                {alert.ai_call_script && (
                  <div className="call-script">
                    <h4><Phone size={16} /> Suggested Call Script</h4>
                    <p>{alert.ai_call_script}</p>
                  </div>
                )}

                {resolvingId === alert.id ? (
                  <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolveNotes}
                      onChange={function(e) { setResolveNotes(e.target.value); }}
                      placeholder="Describe what action was taken..."
                      rows={3}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={function() { handleResolve(alert.id); }}
                        style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                      >
                        Confirm Resolved
                      </button>
                      <button
                        onClick={function() { setResolvingId(null); setResolveNotes(''); }}
                        style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Link to={'/dashboard/patients/' + alert.patient_id} className="btn-secondary">
                      View Details
                    </Link>
                    {alert.status === 'pending' && (
                      <button
                        onClick={function() { handleAcknowledge(alert.id); }}
                        style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={function() { setResolvingId(alert.id); }}
                      style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                    >
                      Resolve
                    </button>
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
  const { user, isAdmin, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(function() {
    if (!agencyId) return;
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setPatients(data);
        setLoading(false);
      })
      .catch(function(err) {
        console.error('Failed to load patients:', err);
        setLoading(false);
      });
  }, [agencyId]);

  if (loading) return <div className="loading">Loading patients...</div>;

  const riskPriority = { critical: 0, elevated: 1, moderate: 2, routine: 3 };

  const filtered = patients.filter(function(p) {
    var term = searchTerm.toLowerCase();
    if (!term) return true;
    var fullName = (p.first_name + ' ' + p.last_name).toLowerCase();
    var conditions = Array.isArray(p.medical_conditions) ? p.medical_conditions.join(' ').toLowerCase() : '';
    var caregiver = (p.caregiver_name || '').toLowerCase();
    return fullName.includes(term) || conditions.includes(term) || caregiver.includes(term);
  });

  var sorted = filtered.slice().sort(function(a, b) {
    if (sortBy === 'risk') {
      return (riskPriority[a.risk_level] || 3) - (riskPriority[b.risk_level] || 3);
    }
    if (sortBy === 'last-checkin') {
      var aDate = a.last_check_in ? new Date(a.last_check_in) : new Date(0);
      var bDate = b.last_check_in ? new Date(b.last_check_in) : new Date(0);
      return aDate - bDate;
    }
    return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name);
  });

  function timeAgo(dateStr) {
    if (!dateStr) return 'No check-ins yet';
    var now = new Date();
    var date = new Date(dateStr);
    var diffMs = now - date;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    var diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';
    return date.toLocaleDateString();
  }

  return (
    <div className="patient-list">
      <header className="page-header">
        <div>
          <h1 className="page-title">Patient Directory</h1>
          <p className="page-subtitle">{patients.length} active patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Link to="/dashboard/new-patient" className="btn-primary">
            <UserPlus size={18} />
            Add Patient
          </Link>
        )}
      </header>

      <div className="list-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search patients, conditions, caregivers..."
            value={searchTerm}
            onChange={function(e) { setSearchTerm(e.target.value); }}
          />
        </div>
        <div className="sort-controls">
          <ArrowUpDown size={16} />
          <select value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}>
            <option value="name">Sort by Name</option>
            <option value="risk">Sort by Risk Level</option>
            <option value="last-checkin">Sort by Last Check-In</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h2>No patients found</h2>
          <p>{searchTerm ? 'Try a different search term.' : 'Add your first patient to get started.'}</p>
        </div>
      ) : (
        <div className="patient-grid">
          {sorted.map(function(patient) {
            return (
              <Link key={patient.id} to={'/dashboard/patients/' + patient.id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-avatar">
                    {patient.first_name?.[0]}{patient.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="patient-name">{patient.first_name} {patient.last_name}</h3>
                    <span className={'risk-badge ' + (patient.risk_level || 'routine')}>
                      {patient.risk_level || 'routine'} risk
                    </span>
                  </div>
                </div>
                <div className="patient-card-body">
                  {patient.medical_conditions && Array.isArray(patient.medical_conditions) && patient.medical_conditions.length > 0 && (
                    <div className="patient-conditions">
                      {patient.medical_conditions.slice(0, 3).map(function(c, i) {
                        return <span key={i} className="condition-tag">{c}</span>;
                      })}
                      {patient.medical_conditions.length > 3 && (
                        <span className="condition-tag more">+{patient.medical_conditions.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="patient-meta">
                    <span><Calendar size={14} /> DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                    {patient.caregiver_name && (
                      <span><Heart size={14} /> {patient.caregiver_name}</span>
                    )}
                  </div>
                  <div className="patient-checkin-info">
                    <div className="checkin-stat">
                      <Clock size={14} />
                      <span className={'last-checkin ' + (!patient.last_check_in ? 'never' : '')}>
                        {timeAgo(patient.last_check_in)}
                      </span>
                    </div>
                    <div className="checkin-stat">
                      <CheckCircle size={14} />
                      <span>{patient.total_check_ins || 0} check-in{(parseInt(patient.total_check_ins) || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="patient-card-footer">
                  <span>View Details <ChevronRight size={16} /></span>
                </div>
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [patient, setPatient] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(function() {
    var promises = [
      authFetch(API_URL + '/api/patients/' + id).then(function(r) { return r.json(); }),
      authFetch(API_URL + '/api/patients/' + id + '/check-ins?limit=10').then(function(r) { return r.json(); })
    ];

    // Only fetch staff list if admin (needed for caregiver assignment dropdown)
    if (isAdmin) {
      promises.push(
        authFetch(API_URL + '/api/agencies/' + agencyId + '/staff').then(function(r) { return r.json(); })
      );
    }

    Promise.all(promises)
      .then(function(results) {
        setPatient(results[0]);
        setCheckIns(Array.isArray(results[1]) ? results[1] : []);
        if (results[2]) {
          setStaffMembers(Array.isArray(results[2]) ? results[2] : []);
        }
        setLoading(false);
      })
      .catch(function(err) {
        console.error('Failed to load patient:', err);
        setLoading(false);
      });
  }, [id]);

  var handleDelete = async function() {
    var confirmed = window.confirm(
      'Are you sure you want to delete ' + patient.first_name + ' ' + patient.last_name + '? This will permanently remove all their check-ins, risk scores, and alerts. This cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      var res = await authFetch(API_URL + '/api/patients/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server returned ' + res.status);
      navigate('/dashboard/patients');
    } catch (err) {
      console.error('Failed to delete patient:', err);
      alert('Failed to delete patient. Please try again.');
      setDeleting(false);
    }
  };

  var handleDownloadReport = async function() {
    setDownloading(true);
    try {
      var res = await authFetch(API_URL + '/api/patients/' + id + '/report');
      if (!res.ok) throw new Error('Server returned ' + res.status);
      var blob = await res.blob();
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = patient.first_name + '-' + patient.last_name + '-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to generate report. Please try again.');
    }
    setDownloading(false);
  };

  var handleAssignCaregiver = async function(caregiverId) {
    setAssigning(true);
    try {
      var res = await authFetch(API_URL + '/api/patients/' + id + '/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregiverId: caregiverId || null })
      });
      if (res.ok) {
        var updatedPatient = await authFetch(API_URL + '/api/patients/' + id).then(function(r) { return r.json(); });
        setPatient(updatedPatient);
      }
    } catch (err) {
      console.error('Failed to assign caregiver:', err);
    }
    setAssigning(false);
  };

  if (loading) return <div className="loading">Loading patient details...</div>;
  if (!patient) return <div className="error">Patient not found</div>;

  return (
    <div className="patient-detail">
      <header className="page-header">
        <div>
          <h1 className="page-title">{patient.first_name} {patient.last_name}</h1>
          <span className={'risk-badge large ' + (patient.risk_level || 'routine')}>
            {patient.risk_level || 'routine'} risk
          </span>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <Download size={18} />
            {downloading ? 'Generating...' : 'Download Report'}
          </button>
          <Link to="/dashboard/check-in" className="btn-primary">
            <CheckCircle size={18} />
            New Check-In
          </Link>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                background: '#dc2626', color: 'white', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 500,
                opacity: deleting ? 0.6 : 1
              }}
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </header>

      <div className="patient-detail-grid">
        <div className="card patient-info-card">
          <h3 className="card-title">Patient Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Caregiver Contact</span>
              <span className="info-value">{patient.caregiver_name || 'Not assigned'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Caregiver Phone</span>
              <span className="info-value">{patient.caregiver_phone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Caregiver Email</span>
              <span className="info-value">{patient.caregiver_email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Assigned Staff Caregiver</h3>
          <div style={{ padding: '0.5rem 0' }}>
            {patient.assigned_first ? (
              <p style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>
                Currently assigned to: {patient.assigned_first} {patient.assigned_last}
              </p>
            ) : (
              <p style={{ margin: '0 0 0.75rem', color: '#64748b' }}>No staff caregiver assigned</p>
            )}
            {isAdmin ? (
              <select
                value={patient.assigned_caregiver_id || ''}
                onChange={function(e) { handleAssignCaregiver(e.target.value); }}
                disabled={assigning}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
              >
                <option value="">Unassigned</option>
                {staffMembers.map(function(s) {
                  return (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.role})
                    </option>
                  );
                })}
              </select>
            ) : (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                {patient.assigned_first ? patient.assigned_first + ' ' + patient.assigned_last : 'Unassigned'}
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Medical Conditions</h3>
          <div className="tags-list">
            {(Array.isArray(patient.medical_conditions) ? patient.medical_conditions : []).map(function(c, i) {
              return <span key={i} className="condition-tag">{c}</span>;
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Medications</h3>
          <div className="tags-list">
            {(Array.isArray(patient.medications) ? patient.medications : []).map(function(m, i) {
              return <span key={i} className="med-tag">{m}</span>;
            })}
          </div>
        </div>

        <div className="card full-width">
          <h3 className="card-title">Recent Check-Ins</h3>
          {checkIns.length === 0 ? (
            <p className="empty-message">No check-ins recorded yet.</p>
          ) : (
            <div className="check-in-history">
              {checkIns.map(function(ci) {
                return (
                  <div key={ci.id} className="check-in-item">
                    <div className="check-in-meta">
                      <span className="check-in-date">
                        <Calendar size={14} />
                        {new Date(ci.submitted_at).toLocaleString()}
                      </span>
                      <span className="check-in-by">by {ci.submitted_by}</span>
                      {ci.risk_score && (
                        <span className={'risk-badge ' + (ci.risk_level || 'routine')}>
                          Score: {ci.risk_score}
                        </span>
                      )}
                    </div>
                    {ci.ai_summary && (
                      <p className="check-in-summary">{ci.ai_summary}</p>
                    )}
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
  const { isAdmin, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('patient');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [startDate, setStartDate] = useState(function() {
    var d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(function() { return new Date().toISOString().split('T')[0]; });
  const [downloading, setDownloading] = useState(false);

  useEffect(function() {
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setPatients(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(function(err) {
        console.error('Failed to load patients:', err);
        setLoading(false);
      });
  }, [agencyId]);

  var handleDownload = async function() {
    if (reportType === 'patient' && !selectedPatient) {
      alert('Please select a patient.');
      return;
    }
    setDownloading(true);
    try {
      var url, filename;
      if (reportType === 'agency') {
        url = API_URL + '/api/agencies/' + agencyId + '/report?start=' + startDate + '&end=' + endDate;
        filename = 'agency-weekly-report-' + startDate + '-to-' + endDate + '.pdf';
      } else {
        url = API_URL + '/api/patients/' + selectedPatient + '/report?start=' + startDate + '&end=' + endDate;
        var pat = patients.find(function(p) { return p.id === selectedPatient; });
        filename = pat
          ? pat.first_name + '-' + pat.last_name + '-report.pdf'
          : 'patient-report.pdf';
      }

      var res = await authFetch(url);
      if (!res.ok) throw new Error('Server returned ' + res.status);
      var blob = await res.blob();
      var blobUrl = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to generate report. Please try again.');
    }
    setDownloading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="check-in-form-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and download PDF reports</p>
        </div>
      </header>

      <div className="check-in-form">
        <div className="form-section">
          <h3>Report Type</h3>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="reportType"
                  value="patient"
                  checked={reportType === 'patient'}
                  onChange={function() { setReportType('patient'); }}
                  style={{ marginRight: '0.5rem' }}
                />
                Individual Patient Report
              </label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 1.5rem' }}>
                Detailed check-ins, risk scores, and alerts for one patient
              </p>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  name="reportType"
                  value="agency"
                  checked={reportType === 'agency'}
                  onChange={function() { setReportType('agency'); }}
                  style={{ marginRight: '0.5rem' }}
                />
                Agency Weekly Summary
              </label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 1.5rem' }}>
                Overview of all patients, risk distribution, alerts, and trends
              </p>
            </div>
          </div>
        </div>

        {reportType === 'patient' && (
          <div className="form-section">
            <h3>Select Patient</h3>
            <div className="form-group">
              <label>Patient *</label>
              <select value={selectedPatient} onChange={function(e) { setSelectedPatient(e.target.value); }}>
                <option value="">Choose a patient...</option>
                {patients.map(function(p) {
                  return (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} — {p.risk_level || 'routine'} risk
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Date Range</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={function(e) { setStartDate(e.target.value); }} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={function(e) { setEndDate(e.target.value); }} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={handleDownload}
            className="btn-primary btn-large"
            disabled={downloading || (reportType === 'patient' && !selectedPatient)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={20} />
            {downloading ? 'Generating PDF...' : reportType === 'agency' ? 'Download Agency Report' : 'Download Patient Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== CHECK-IN FORM ====================
function CheckInForm() {
  const { user, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const [patients, setPatients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    submittedBy: '',
    painLevel: 0,
    painLocation: '',
    mobilityStatus: 'independent',
    moodStatus: 'normal',
    medicationsTaken: true,
    missedMedications: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    newSymptoms: '',
    fallIncident: false,
    catheterConcerns: false,
    woundConcerns: false,
    additionalNotes: ''
  });

  useEffect(function() {
    if (!agencyId) return;
    authFetch(API_URL + '/api/agencies/' + agencyId + '/patients')
      .then(function(res) { return res.json(); })
      .then(function(data) { setPatients(data); })
      .catch(function(err) { console.error('Failed to load patients:', err); });
  }, [agencyId]);

  var handleSubmit = function(e) {
    e.preventDefault();
    setSubmitting(true);

    var submitData = {
      patientId: formData.patientId,
      submittedBy: formData.submittedBy,
      painLevel: formData.painLevel,
      painLocation: formData.painLocation || null,
      mobilityStatus: formData.mobilityStatus,
      moodStatus: formData.moodStatus,
      medicationsTaken: formData.medicationsTaken,
      missedMedications: !formData.medicationsTaken && formData.missedMedications
        ? formData.missedMedications.split(',').map(function(m) { return m.trim(); })
        : null,
      newSymptoms: formData.newSymptoms
        ? formData.newSymptoms.split(',').map(function(s) { return s.trim(); })
        : null,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      bloodPressure: formData.bloodPressure || null,
      heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
      fallIncident: formData.fallIncident,
      catheterConcerns: formData.catheterConcerns,
      woundConcerns: formData.woundConcerns,
      additionalNotes: formData.additionalNotes || null
    };

    authFetch(API_URL + '/api/check-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setResult(data);
        setSubmitting(false);
      })
      .catch(function(err) {
        console.error('Failed to submit check-in:', err);
        setSubmitting(false);
      });
  };

  if (result) {
    return (
      <div className="check-in-result">
        <div className={'result-card ' + (result.riskScore?.level || 'routine')}>
          <CheckCircle size={64} />
          <h2>Check-In Recorded</h2>
          <p className="result-message">{result.message}</p>
          <div className="result-details">
            <h3>Risk Assessment</h3>
            <div className="risk-score">
              <span className="score-value">{result.riskScore?.score || 0}/100</span>
              <span className={'risk-badge large ' + (result.riskScore?.level || 'routine')}>
                {result.riskScore?.level || 'routine'}
              </span>
            </div>
            {result.riskScore?.factors?.length > 0 && (
              <div className="risk-factors">
                <h4>Detected Factors:</h4>
                <ul>
                  {result.riskScore.factors.map(function(factor, i) {
                    return <li key={i}>{factor}</li>;
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={function() { setResult(null); }}>
              Submit Another Check-In
            </button>
            {result.alert && (
              <Link to="/dashboard/triage" className="btn-secondary">
                View in Triage Queue
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="check-in-form-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Daily Check-In</h1>
          <p className="page-subtitle">Record patient status and concerns</p>
        </div>
      </header>

      <form className="check-in-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Patient Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Patient *</label>
              <select value={formData.patientId} onChange={function(e) { setFormData(Object.assign({}, formData, { patientId: e.target.value })); }} required>
                <option value="">Select patient...</option>
                {patients.map(function(p) {
                  return <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>;
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Submitted by *</label>
              <input type="text" value={formData.submittedBy} onChange={function(e) { setFormData(Object.assign({}, formData, { submittedBy: e.target.value })); }} placeholder="Your name or relationship" required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pain &amp; Comfort</h3>
          <div className="form-group">
            <label>Pain Level: {formData.painLevel}/10</label>
            <input type="range" min="0" max="10" value={formData.painLevel} onChange={function(e) { setFormData(Object.assign({}, formData, { painLevel: parseInt(e.target.value) })); }} className="pain-slider" />
          </div>
          {formData.painLevel > 0 && (
            <div className="form-group">
              <label>Pain Location</label>
              <input type="text" value={formData.painLocation} onChange={function(e) { setFormData(Object.assign({}, formData, { painLocation: e.target.value })); }} placeholder="e.g., lower back, right knee" />
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Mobility &amp; Mood</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Mobility Status</label>
              <select value={formData.mobilityStatus} onChange={function(e) { setFormData(Object.assign({}, formData, { mobilityStatus: e.target.value })); }}>
                <option value="independent">Independent</option>
                <option value="assisted">Needs Assistance</option>
                <option value="limited">Limited Mobility</option>
                <option value="bedbound">Bedbound</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mood</label>
              <select value={formData.moodStatus} onChange={function(e) { setFormData(Object.assign({}, formData, { moodStatus: e.target.value })); }}>
                <option value="normal">Normal / Stable</option>
                <option value="anxious">Anxious</option>
                <option value="agitated">Agitated</option>
                <option value="confused">Confused</option>
                <option value="depressed">Depressed</option>
                <option value="distressed">Distressed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Medications</h3>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={formData.medicationsTaken} onChange={function(e) { setFormData(Object.assign({}, formData, { medicationsTaken: e.target.checked })); }} />
              All medications taken as prescribed
            </label>
          </div>
          {!formData.medicationsTaken && (
            <div className="form-group">
              <label>Missed Medications (comma-separated)</label>
              <input type="text" value={formData.missedMedications} onChange={function(e) { setFormData(Object.assign({}, formData, { missedMedications: e.target.value })); }} placeholder="e.g., Morning blood pressure med, Evening insulin" />
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Vital Signs (if available)</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Temperature (degrees F)</label>
              <input type="number" step="0.1" value={formData.temperature} onChange={function(e) { setFormData(Object.assign({}, formData, { temperature: e.target.value })); }} placeholder="98.6" />
            </div>
            <div className="form-group">
              <label>Blood Pressure</label>
              <input type="text" value={formData.bloodPressure} onChange={function(e) { setFormData(Object.assign({}, formData, { bloodPressure: e.target.value })); }} placeholder="120/80" />
            </div>
            <div className="form-group">
              <label>Heart Rate (bpm)</label>
              <input type="number" value={formData.heartRate} onChange={function(e) { setFormData(Object.assign({}, formData, { heartRate: e.target.value })); }} placeholder="72" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Concerns</h3>
          <div className="form-group">
            <label>New Symptoms (comma-separated)</label>
            <input type="text" value={formData.newSymptoms} onChange={function(e) { setFormData(Object.assign({}, formData, { newSymptoms: e.target.value })); }} placeholder="e.g., shortness of breath, swelling, dizziness" />
          </div>
          <div className="checkbox-grid">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.fallIncident} onChange={function(e) { setFormData(Object.assign({}, formData, { fallIncident: e.target.checked })); }} />
              Fall incident
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.catheterConcerns} onChange={function(e) { setFormData(Object.assign({}, formData, { catheterConcerns: e.target.checked })); }} />
              Catheter concerns
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.woundConcerns} onChange={function(e) { setFormData(Object.assign({}, formData, { woundConcerns: e.target.checked })); }} />
              Wound concerns
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Notes</h3>
          <div className="form-group">
            <textarea value={formData.additionalNotes} onChange={function(e) { setFormData(Object.assign({}, formData, { additionalNotes: e.target.value })); }} placeholder="Any other observations or concerns..." rows={4} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary btn-large" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Check-In'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==================== NEW PATIENT FORM ====================
function NewPatientForm() {
  const { user, agencyId: authAgencyId } = useAuth();
  const agencyId = authAgencyId || '1f027307-125d-4904-8734-0424676a717d';
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    medicalConditions: '',
    medications: '',
    caregiverName: '',
    caregiverPhone: '',
    caregiverEmail: ''
  });

  var handleSubmit = function(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    var payload = {
      agencyId: agencyId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      medicalConditions: formData.medicalConditions
        ? formData.medicalConditions.split(',').map(function(c) { return c.trim(); }).filter(Boolean)
        : [],
      medications: formData.medications
        ? formData.medications.split(',').map(function(m) { return m.trim(); }).filter(Boolean)
        : [],
      caregiverName: formData.caregiverName.trim() || null,
      caregiverPhone: formData.caregiverPhone.trim() || null,
      caregiverEmail: formData.caregiverEmail.trim() || null
    };

    authFetch(API_URL + '/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(res) {
        if (!res.ok) throw new Error('Server returned ' + res.status);
        return res.json();
      })
      .then(function(data) {
        setSubmitting(false);
        setSuccess(data);
      })
      .catch(function(err) {
        console.error('Failed to add patient:', err);
        setError(err.message || 'Failed to add patient. Please try again.');
        setSubmitting(false);
      });
  };

  if (success) {
    return (
      <div className="check-in-result">
        <div className="result-card routine">
          <CheckCircle size={64} />
          <h2>Patient Added Successfully</h2>
          <p className="result-message">
            {success.first_name || formData.firstName} {success.last_name || formData.lastName} has been added to your patient directory.
          </p>
          <div className="result-actions">
            <button className="btn-primary" onClick={function() { setSuccess(null); setFormData({ firstName: '', lastName: '', dateOfBirth: '', medicalConditions: '', medications: '', caregiverName: '', caregiverPhone: '', caregiverEmail: '' }); }}>
              Add Another Patient
            </button>
            <Link to="/dashboard/patients" className="btn-secondary">
              View Patient Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="check-in-form-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Add New Patient</h1>
          <p className="page-subtitle">Register a new patient for monitoring</p>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={function() { setError(null); }}>&times;</button>
        </div>
      )}

      <form className="check-in-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Patient Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" value={formData.firstName} onChange={function(e) { setFormData(Object.assign({}, formData, { firstName: e.target.value })); }} placeholder="e.g., Margaret" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" value={formData.lastName} onChange={function(e) { setFormData(Object.assign({}, formData, { lastName: e.target.value })); }} placeholder="e.g., Chen" required />
            </div>
          </div>
          <div className="form-group">
            <label>Date of Birth *</label>
            <input type="date" value={formData.dateOfBirth} onChange={function(e) { setFormData(Object.assign({}, formData, { dateOfBirth: e.target.value })); }} required />
          </div>
        </div>

        <div className="form-section">
          <h3>Medical Information</h3>
          <div className="form-group">
            <label>Medical Conditions (comma-separated)</label>
            <input type="text" value={formData.medicalConditions} onChange={function(e) { setFormData(Object.assign({}, formData, { medicalConditions: e.target.value })); }} placeholder="e.g., Type 2 Diabetes, Hypertension, Arthritis" />
          </div>
          <div className="form-group">
            <label>Medications (comma-separated)</label>
            <input type="text" value={formData.medications} onChange={function(e) { setFormData(Object.assign({}, formData, { medications: e.target.value })); }} placeholder="e.g., Metformin 500mg, Lisinopril 10mg, Aspirin 81mg" />
          </div>
        </div>

        <div className="form-section">
          <h3>Caregiver Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Caregiver Name</label>
              <input type="text" value={formData.caregiverName} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverName: e.target.value })); }} placeholder="e.g., Lisa Chen" />
            </div>
            <div className="form-group">
              <label>Caregiver Phone</label>
              <input type="tel" value={formData.caregiverPhone} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverPhone: e.target.value })); }} placeholder="e.g., 555-0123" />
            </div>
          </div>
          <div className="form-group">
            <label>Caregiver Email</label>
            <input type="email" value={formData.caregiverEmail} onChange={function(e) { setFormData(Object.assign({}, formData, { caregiverEmail: e.target.value })); }} placeholder="e.g., lisa.chen@email.com" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary btn-large" disabled={submitting}>
            {submitting ? 'Adding Patient...' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
