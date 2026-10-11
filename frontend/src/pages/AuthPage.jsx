import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('resident'); // 'resident' or 'owner'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    emergencyContact: '',
    address: '',
    gender: 'male',
    pgName: '',
    pgAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password, role);
        if (res.user.role === 'owner') {
          navigate('/owner/dashboard');
        } else {
          navigate('/resident/dashboard');
        }
      } else {
        const payload = {
          ...formData,
          role
        };
        const res = await signup(payload);
        if (res.user.role === 'owner') {
          navigate('/owner/dashboard');
        } else {
          navigate('/resident/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoRole) => {
    setRole(demoRole);
    setIsLogin(true);
    if (demoRole === 'resident') {
      setFormData({
        ...formData,
        email: 'resident@smartpg.com',
        password: 'resident123'
      });
    } else {
      setFormData({
        ...formData,
        email: 'owner@smartpg.com',
        password: 'owner123'
      });
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #eff6ff 100%)' }}>
      
      {/* Brand Header */}
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center gap-2 p-2 px-3 rounded-pill bg-white shadow-sm mb-2 border">
          <i className="bi bi-buildings-fill text-primary fs-4"></i>
          <span className="fw-bold fs-5 text-dark">SmartPG Living</span>
        </div>
        <p className="text-muted small">Modern PG & Hostel Management Platform</p>
      </div>

      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: '520px' }}>
        {/* Role Selector Tabs */}
        <div className="d-flex border-bottom bg-light">
          <button
            type="button"
            className={`flex-fill py-3 border-0 fw-bold transition-all ${role === 'resident' ? 'bg-white text-primary border-bottom border-primary border-3' : 'text-muted'}`}
            onClick={() => setRole('resident')}
          >
            <i className="bi bi-person-fill me-2"></i> Resident Portal
          </button>
          <button
            type="button"
            className={`flex-fill py-3 border-0 fw-bold transition-all ${role === 'owner' ? 'bg-white text-primary border-bottom border-primary border-3' : 'text-muted'}`}
            onClick={() => setRole('owner')}
          >
            <i className="bi bi-shield-lock-fill me-2"></i> PG Owner Portal
          </button>
        </div>

        <div className="card-body p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h3>
            <p className="text-muted small">
              {isLogin
                ? `Enter your credentials to access the ${role === 'owner' ? 'Owner' : 'Resident'} Dashboard`
                : `Join SmartPG as a ${role === 'owner' ? 'PG Owner / Manager' : 'Hostel Resident'}`}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Aarav Patel"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="bi bi-phone"></i></span>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {role === 'resident' ? (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Emergency Contact</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      placeholder="e.g. +91 9988776655 (Father)"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">PG / Hostel Name</label>
                    <input
                      type="text"
                      name="pgName"
                      placeholder="e.g. Sunrise Luxury PG"
                      value={formData.pgName}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                )}
              </>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-brand w-100 py-2 fs-6 shadow-sm mb-3"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              ) : null}
              {isLogin ? `Sign In as ${role === 'owner' ? 'Owner' : 'Resident'}` : 'Register Account'}
            </button>
          </form>

          {/* Quick Demo Pre-fill helper */}
          <div className="p-3 bg-light rounded-3 border text-center mb-3">
            <span className="small text-muted d-block mb-2">⚡ Quick Test Credentials:</span>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => handleDemoFill('resident')}
                className="btn btn-sm btn-outline-primary"
              >
                Fill Resident Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('owner')}
                className="btn btn-sm btn-outline-dark"
              >
                Fill Owner Demo
              </button>
            </div>
          </div>

          <div className="text-center">
            {isLogin ? (
              <p className="small text-muted mb-0">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="btn btn-link p-0 small fw-bold text-decoration-none"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="small text-muted mb-0">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="btn btn-link p-0 small fw-bold text-decoration-none"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
