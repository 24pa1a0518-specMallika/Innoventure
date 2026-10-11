import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export const TopNavbar = ({ title }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="top-navbar d-flex justify-content-between align-items-center sticky-top shadow-sm">
      <div className="d-flex align-items-center gap-3">
        <h4 className="m-0 fw-bold text-navy" style={{ color: '#0f172a' }}>{title}</h4>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notifications */}
        <div className="position-relative">
          <button
            className="btn btn-light rounded-circle position-relative p-2"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Notifications"
          >
            <i className="bi bi-bell-fill text-secondary fs-5"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg p-2 border"
              style={{ width: '320px', zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
            >
              <div className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom">
                <span className="fw-semibold text-dark">Notifications</span>
                <span className="badge bg-primary-subtle text-primary">{unreadCount} new</span>
              </div>
              {notifications.length === 0 ? (
                <div className="p-3 text-center text-muted small">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markAsRead(n._id)}
                    className={`p-2 border-bottom cursor-pointer ${n.isRead ? 'opacity-75' : 'bg-light'} rounded mb-1`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <strong className="small text-dark">{n.title}</strong>
                      {!n.isRead && <span className="badge bg-primary rounded-circle p-1"></span>}
                    </div>
                    <p className="small text-muted mb-0">{n.message}</p>
                    <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Info & Avatar */}
        <div className="d-flex align-items-center gap-2 border-start ps-3">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
            style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #1e3a8a)' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="d-none d-md-block text-start">
            <div className="fw-bold small text-dark leading-tight">{user?.name}</div>
            <span className={`badge ${user?.role === 'owner' ? 'badge-role-owner' : 'badge-role-resident'} py-0 px-2`} style={{ fontSize: '0.7rem' }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button onClick={logout} className="btn btn-outline-danger btn-sm ms-2" title="Sign Out">
          <i className="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </nav>
  );
};
