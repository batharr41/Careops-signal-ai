import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

var API_URL = import.meta.env.VITE_API_URL || '';

var AuthContext = createContext({});

export function AuthProvider({ children }) {
  var _user = useState(null);
  var user = _user[0], setUser = _user[1];
  var _userRole = useState(null);
  var userRole = _userRole[0], setUserRole = _userRole[1];
  var _agencyId = useState(null);
  var agencyId = _agencyId[0], setAgencyId = _agencyId[1];
  var _linkedPatientId = useState(null);
  var linkedPatientId = _linkedPatientId[0], setLinkedPatientId = _linkedPatientId[1];
  var _loading = useState(true);
  var loading = _loading[0], setLoading = _loading[1];
  var _demoMode = useState(false);
  var demoMode = _demoMode[0], setDemoMode = _demoMode[1];
  var _needsOnboarding = useState(false);
  var needsOnboarding = _needsOnboarding[0], setNeedsOnboarding = _needsOnboarding[1];
  var _trialExpired = useState(false);
  var trialExpired = _trialExpired[0], setTrialExpired = _trialExpired[1];
  var _trialEndsAt = useState(null);
  var trialEndsAt = _trialEndsAt[0], setTrialEndsAt = _trialEndsAt[1];

  function fetchUserProfile(session) {
    if (!session || !session.access_token) {
      setUserRole(null);
      setAgencyId(null);
      setLinkedPatientId(null);
      setNeedsOnboarding(false);
      setTrialExpired(false);
      setTrialEndsAt(null);
      return Promise.resolve();
    }
    return fetch(API_URL + '/api/me', {
      headers: { Authorization: 'Bearer ' + session.access_token }
    })
      .then(function(res) {
        if (res.ok) return res.json();
        return null;
      })
      .then(function(profile) {
        if (profile) {
          if (profile.needs_onboarding) {
            setNeedsOnboarding(true);
            setUserRole(null);
            setAgencyId(null);
            setTrialExpired(false);
            setTrialEndsAt(null);
          } else {
            setNeedsOnboarding(false);
            setUserRole(profile.role || null);
            setAgencyId(profile.agency_id || null);
            setLinkedPatientId(profile.patient_id || null);
            setTrialExpired(profile.trial_expired || false);
            setTrialEndsAt(profile.trial_ends_at || null);
          }
        }
      })
      .catch(function(err) {
        console.error('Failed to fetch user profile:', err);
      });
  }

  function refreshProfile() {
    return supabase.auth.getSession().then(function(result) {
      var session = result.data.session;
      if (session) return fetchUserProfile(session);
    });
  }

  useEffect(function() {
    supabase.auth.getSession().then(function(result) {
      var session = result.data.session;
      setUser(session ? session.user : null);
      if (session && session.user) {
        fetchUserProfile(session).then(function() { setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      setUser(session ? session.user : null);
      if (session && session.user) {
        fetchUserProfile(session);
      } else {
        setUserRole(null);
        setAgencyId(null);
        setLinkedPatientId(null);
        setNeedsOnboarding(false);
        setTrialExpired(false);
        setTrialEndsAt(null);
      }
    });

    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  function signUp(email, password) {
    return supabase.auth.signUp({ email: email, password: password });
  }

  function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email: email, password: password });
  }

  function signOut() {
    if (demoMode) {
      setDemoMode(false);
      setUser(null);
      setUserRole(null);
      setAgencyId(null);
      setLinkedPatientId(null);
      setNeedsOnboarding(false);
      setTrialExpired(false);
      setTrialEndsAt(null);
      return Promise.resolve();
    }
    return supabase.auth.signOut();
  }

  function startDemo() {
    setDemoMode(true);
    setNeedsOnboarding(false);
    setTrialExpired(false);
    setTrialEndsAt(null);
    setUser({ email: 'demo@betweenvisits.com', id: 'demo-user' });
    setUserRole('admin');
    setAgencyId('demo-agency-001');
    setLinkedPatientId(null);
  }

  var isAdmin = userRole === 'admin';
  var isCaregiver = userRole === 'caregiver';
  var isFamily = userRole === 'family';

  return React.createElement(AuthContext.Provider, {
    value: {
      user: user,
      loading: loading,
      signUp: signUp,
      signIn: signIn,
      signOut: signOut,
      userRole: userRole,
      agencyId: agencyId,
      linkedPatientId: linkedPatientId,
      isAdmin: isAdmin,
      isCaregiver: isCaregiver,
      isFamily: isFamily,
      demoMode: demoMode,
      startDemo: startDemo,
      needsOnboarding: needsOnboarding,
      trialExpired: trialExpired,
      trialEndsAt: trialEndsAt,
      refreshProfile: refreshProfile
    }
  }, !loading && children);
}

export function useAuth() {
  return useContext(AuthContext);
}
