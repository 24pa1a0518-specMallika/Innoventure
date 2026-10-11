import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { TopNavbar } from '../components/TopNavbar';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, residents, rooms, bookings, payments, verifications, attendance, complaints, visitors, broadcasts

  // Data States
  const [summary, setSummary] = useState(null);
  const [residents, setResidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);

  // Forms & UI feedback
  const [message, setMessage] = useState({ text: '', type: '' });
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    floor: 1,
    roomType: 'Double Sharing',
    capacity: 2,
    rentPerMonth: '',
    amenities: 'WiFi, Geyser, Attached Bathroom, Cupboard'
  });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });
  const [allocateForm, setAllocateForm] = useState({ roomId: '', residentId: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchAllData = async () => {
    try {
      const [sumRes, resRes, rmRes, bkRes, payRes, attRes, cmpRes, visRes] = await Promise.all([
        API.get('/reports/summary'),
        API.get('/reports/residents'),
        API.get('/rooms'),
        API.get('/bookings/all'),
        API.get('/payments/all'),
        API.get('/attendance/all'),
        API.get('/complaints/all'),
        API.get('/visitors/all')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (resRes.data.success) setResidents(resRes.data.residents);
      if (rmRes.data.success) setRooms(rmRes.data.rooms);
      if (bkRes.data.success) setBookings(bkRes.data.bookings);
      if (payRes.data.success) setPayments(payRes.data.payments);
      if (attRes.data.success) setAttendance(attRes.data.records);
      if (cmpRes.data.success) setComplaints(cmpRes.data.complaints);
      if (visRes.data.success) setVisitors(visRes.data.visitors);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = newRoom.amenities.split(',').map(s => s.trim());
      const res = await API.post('/rooms', {
        ...newRoom,
        capacity: Number(newRoom.capacity),
        rentPerMonth: Number(newRoom.rentPerMonth),
        amenities: amenitiesArr
      });
      if (res.data.success) {
        showMsg(res.data.message);
        setNewRoom({ roomNumber: '', floor: 1, roomType: 'Double Sharing', capacity: 2, rentPerMonth: '', amenities: 'WiFi, Geyser, Attached Bathroom' });
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add room.', 'danger');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await API.delete(`/rooms/${roomId}`);
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to delete room.', 'danger');
    }
  };

  // Allocate Room to resident
  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/rooms/allocate', allocateForm);
      if (res.data.success) {
        showMsg(res.data.message);
        setAllocateForm({ roomId: '', residentId: '' });
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Allocation failed.', 'danger');
    }
  };

  // Deallocate resident
  const handleDeallocate = async (residentId) => {
    if (!window.confirm('Deallocate this resident from their room?')) return;
    try {
      const res = await API.post('/rooms/deallocate', { residentId });
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Deallocation failed.', 'danger');
    }
  };

  // Booking Approval / Reject
  const handleBookingAction = async (id, status) => {
    const note = prompt(`Enter note for resident (${status}):`, status === 'approved' ? 'Welcome to SmartPG!' : 'No vacancy for requested dates.');
    try {
      const res = await API.put(`/bookings/${id}/status`, { status, ownerNote: note || '' });
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Action failed.', 'danger');
    }
  };

  // Verify Document
  const handleVerifyDocument = async (residentId, status) => {
    const note = prompt(`Enter verification note (${status}):`, status === 'verified' ? 'Identity verified.' : 'Uploaded document is unreadable.');
    try {
      const res = await API.put(`/documents/verify/${residentId}`, { status, note });
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Verification update failed.', 'danger');
    }
  };

  // Verify Payment
  const handleVerifyPayment = async (paymentId, status) => {
    try {
      const res = await API.put(`/payments/${paymentId}/verify`, { status });
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Payment status update failed.', 'danger');
    }
  };

  // Update Complaint Status
  const handleComplaintStatus = async (complaintId, status) => {
    const note = prompt(`Update complaint note (${status}):`, 'Technician inspected and completed.');
    try {
      const res = await API.put(`/complaints/${complaintId}/status`, { status, resolutionNote: note || '' });
      if (res.data.success) {
        showMsg(res.data.message);
        fetchAllData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update ticket.', 'danger');
    }
  };

  // Broadcast announcement
  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/notifications/broadcast', broadcastForm);
      if (res.data.success) {
        showMsg(res.data.message);
        setBroadcastForm({ title: '', message: '' });
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Broadcast failed.', 'danger');
    }
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="sidebar shadow-sm d-none d-lg-flex">
        <div className="p-3 border-bottom d-flex align-items-center gap-2">
          <i className="bi bi-shield-check text-warning fs-3"></i>
          <div>
            <h6 className="fw-bold mb-0 text-dark">SmartPG Admin</h6>
            <small className="text-muted">PG Owner Control Panel</small>
          </div>
        </div>

        <div className="nav flex-column p-2 mt-2 flex-grow-1">
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="bi bi-bar-chart-fill"></i> Analytics & Reports
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveTab('residents')}
          >
            <i className="bi bi-people-fill"></i> Manage Residents
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <i className="bi bi-door-open-fill"></i> PG Rooms & Beds
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="bi bi-calendar2-check-fill"></i> Booking Requests
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="badge bg-danger ms-auto">{bookings.filter(b => b.status === 'pending').length}</span>
            )}
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'verifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifications')}
          >
            <i className="bi bi-file-earmark-check-fill"></i> Document Verification
            {residents.filter(r => r.verificationStatus === 'pending').length > 0 && (
              <span className="badge bg-warning text-dark ms-auto">{residents.filter(r => r.verificationStatus === 'pending').length}</span>
            )}
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <i className="bi bi-cash-stack"></i> Rent & Payments
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <span className="badge bg-primary ms-auto">{payments.filter(p => p.status === 'pending').length}</span>
            )}
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="bi bi-clock-history"></i> Daily Attendance
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <i className="bi bi-exclamation-octagon-fill"></i> Complaints & Repairs
            {complaints.filter(c => c.status === 'open').length > 0 && (
              <span className="badge bg-danger ms-auto">{complaints.filter(c => c.status === 'open').length}</span>
            )}
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => setActiveTab('visitors')}
          >
            <i className="bi bi-person-lines-fill"></i> Visitor Logs
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'broadcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcasts')}
          >
            <i className="bi bi-broadcast"></i> Announcements
          </button>
        </div>

        <div className="p-3 border-top bg-light">
          <div className="small fw-semibold text-dark">{user?.pgName || 'Sunrise Luxury PG'}</div>
          <small className="text-muted text-truncate d-block">{user?.email}</small>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <TopNavbar title="PG Owner Dashboard" />

        <div className="p-3 p-md-4 flex-grow-1 overflow-auto">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`} role="alert">
              <i className="bi bi-info-circle-fill me-2"></i> {message.text}
            </div>
          )}

          {/* Mobile Tab Navigation */}
          <div className="d-lg-none mb-3 overflow-auto d-flex gap-2 pb-2">
            {[
              { id: 'analytics', label: 'Analytics' },
              { id: 'residents', label: 'Residents' },
              { id: 'rooms', label: 'Rooms' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'verifications', label: 'Docs' },
              { id: 'payments', label: 'Payments' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'complaints', label: 'Complaints' },
              { id: 'visitors', label: 'Visitors' },
              { id: 'broadcasts', label: 'Broadcast' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`btn btn-sm text-nowrap ${activeTab === t.id ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: ANALYTICS & REPORTS */}
          {activeTab === 'analytics' && (
            <div>
              <div className="hero-banner mb-4 shadow-sm">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h2 className="fw-bold mb-1">Hostel Operations Overview</h2>
                    <p className="text-light opacity-90 mb-0">
                      Real-time visibility across occupancy, rent collection, verifications, and complaints for <strong>{user?.pgName || 'Smart Stay PG'}</strong>.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <button onClick={() => setActiveTab('broadcasts')} className="btn btn-warning text-dark fw-semibold shadow-sm">
                      <i className="bi bi-megaphone-fill me-1"></i> Send Announcement
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Total Residents</div>
                      <h4 className="fw-bold mb-0">{summary?.totalResidents ?? residents.length}</h4>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-success-subtle text-success">
                      <i className="bi bi-door-open-fill"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Beds Occupied</div>
                      <h4 className="fw-bold mb-0">{summary?.occupiedBeds ?? 0} / {summary?.totalBeds ?? 0}</h4>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-info-subtle text-info">
                      <i className="bi bi-currency-rupee"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Verified Revenue</div>
                      <h4 className="fw-bold mb-0">₹{(summary?.totalRevenue ?? 0).toLocaleString()}</h4>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Pending Issues</div>
                      <h4 className="fw-bold mb-0">{summary?.openComplaints ?? 0}</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Panels */}
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="card-custom p-4 h-100">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-bell-fill text-warning"></i> Action Required Items
                    </h5>
                    <ul className="list-group list-group-flush small">
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>New Room Booking Requests</span>
                        <button onClick={() => setActiveTab('bookings')} className="btn btn-sm btn-outline-primary">
                          {bookings.filter(b => b.status === 'pending').length} Pending Review
                        </button>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Govt ID Proofs to Verify</span>
                        <button onClick={() => setActiveTab('verifications')} className="btn btn-sm btn-outline-warning">
                          {residents.filter(r => r.verificationStatus === 'pending').length} Pending
                        </button>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Rent Payments Awaiting Verification</span>
                        <button onClick={() => setActiveTab('payments')} className="btn btn-sm btn-outline-success">
                          {payments.filter(p => p.status === 'pending').length} Pending
                        </button>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Open Resident Maintenance Tickets</span>
                        <button onClick={() => setActiveTab('complaints')} className="btn btn-sm btn-outline-danger">
                          {complaints.filter(c => c.status === 'open').length} Unresolved
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card-custom p-4 h-100">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-pie-chart-fill text-primary"></i> Occupancy Distribution
                    </h5>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Bed Capacity Fill Rate</span>
                        <span>
                          {summary?.totalBeds ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0}%
                        </span>
                      </div>
                      <div className="progress" style={{ height: '12px' }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{
                            width: `${summary?.totalBeds ? (summary.occupiedBeds / summary.totalBeds) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="row g-2 mt-2 text-center">
                      <div className="col-4 p-2 bg-light rounded-2 border">
                        <div className="small text-muted">Total Rooms</div>
                        <h6 className="fw-bold mb-0">{rooms.length}</h6>
                      </div>
                      <div className="col-4 p-2 bg-light rounded-2 border">
                        <div className="small text-muted">Occupied Beds</div>
                        <h6 className="fw-bold mb-0 text-success">{summary?.occupiedBeds ?? 0}</h6>
                      </div>
                      <div className="col-4 p-2 bg-light rounded-2 border">
                        <div className="small text-muted">Available Beds</div>
                        <h6 className="fw-bold mb-0 text-primary">{summary?.availableBeds ?? 0}</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESIDENTS */}
          {activeTab === 'residents' && (
            <div className="card-custom p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Registered Residents Directory ({residents.length})</h5>
              </div>

              {residents.length === 0 ? (
                <p className="text-muted small">No residents registered yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Resident Name</th>
                        <th>Contact</th>
                        <th>Room</th>
                        <th>ID Proof Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residents.map(r => (
                        <tr key={r._id}>
                          <td>
                            <div className="fw-bold">{r.name}</div>
                            <span className="small text-muted">{r.gender || 'Not specified'}</span>
                          </td>
                          <td className="small">
                            <div><i className="bi bi-envelope me-1"></i>{r.email}</div>
                            <div><i className="bi bi-phone me-1"></i>{r.phone}</div>
                          </td>
                          <td>
                            {r.room ? (
                              <span className="badge bg-primary-subtle text-primary">
                                Room #{r.room.roomNumber} ({r.room.roomType})
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary">Unallocated</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${r.verificationStatus === 'verified' ? 'badge-verified' : r.verificationStatus === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                              {r.verificationStatus}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {r.room && (
                                <button
                                  onClick={() => handleDeallocate(r._id)}
                                  className="btn btn-sm btn-outline-danger"
                                  title="Deallocate from room"
                                >
                                  Deallocate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveTab('verifications');
                                }}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                View ID
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOMS & ALLOCATION */}
          {activeTab === 'rooms' && (
            <div>
              {/* Allocation & Add Room row */}
              <div className="row g-4 mb-4">
                <div className="col-lg-7">
                  <div className="card-custom p-4">
                    <h5 className="fw-bold mb-3">Add New PG Room</h5>
                    <form onSubmit={handleAddRoom}>
                      <div className="row g-2 mb-3">
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Room Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. 301"
                            value={newRoom.roomNumber}
                            onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Floor</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newRoom.floor}
                            onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Type</label>
                          <select
                            className="form-select"
                            value={newRoom.roomType}
                            onChange={(e) => {
                              const t = e.target.value;
                              const cap = t === 'Single' ? 1 : t === 'Double Sharing' ? 2 : 3;
                              setNewRoom({ ...newRoom, roomType: t, capacity: cap });
                            }}
                          >
                            <option value="Single">Single</option>
                            <option value="Double Sharing">Double Sharing</option>
                            <option value="Triple Sharing">Triple Sharing</option>
                          </select>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Capacity (Beds)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newRoom.capacity}
                            onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Monthly Rent (₹)</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 8000"
                            value={newRoom.rentPerMonth}
                            onChange={(e) => setNewRoom({ ...newRoom, rentPerMonth: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Amenities (Comma separated)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newRoom.amenities}
                          onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn btn-brand">Create Room</button>
                    </form>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="card-custom p-4">
                    <h5 className="fw-bold mb-3">Manual Resident Allocation</h5>
                    <p className="small text-muted">Directly allocate an unallocated resident into an available room.</p>
                    <form onSubmit={handleAllocate}>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Select Resident</label>
                        <select
                          className="form-select"
                          value={allocateForm.residentId}
                          onChange={(e) => setAllocateForm({ ...allocateForm, residentId: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Resident --</option>
                          {residents.map(r => (
                            <option key={r._id} value={r._id}>
                              {r.name} ({r.room ? `Current: Room ${r.room.roomNumber}` : 'Unallocated'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Target Room</label>
                        <select
                          className="form-select"
                          value={allocateForm.roomId}
                          onChange={(e) => setAllocateForm({ ...allocateForm, roomId: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Room --</option>
                          {rooms.map(r => (
                            <option
                              key={r._id}
                              value={r._id}
                              disabled={r.residents.length >= r.capacity}
                            >
                              Room {r.roomNumber} ({r.residents.length}/{r.capacity} beds)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="submit" className="btn btn-primary w-100">
                        Confirm Allocation
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Rooms List */}
              <div className="card-custom p-4">
                <h5 className="fw-bold mb-3">Current Rooms & Occupants</h5>
                <div className="row g-3">
                  {rooms.map(r => (
                    <div key={r._id} className="col-md-6 col-xl-4">
                      <div className="card-custom p-3 border h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="fw-bold mb-0">Room #{r.roomNumber}</h5>
                            <span className={`badge ${r.residents.length >= r.capacity ? 'bg-danger' : 'bg-success'}`}>
                              {r.residents.length}/{r.capacity} Beds
                            </span>
                          </div>
                          <div className="text-primary fw-bold mb-2">
                            ₹{r.rentPerMonth.toLocaleString()} <span className="small text-muted fw-normal">/ mo</span>
                          </div>
                          <div className="small text-muted mb-2">
                            <div><strong>Type:</strong> {r.roomType} (Floor {r.floor})</div>
                          </div>

                          <div className="mb-3">
                            <span className="small text-muted d-block mb-1">Current Residents:</span>
                            {r.residents.length === 0 ? (
                              <span className="small text-secondary fst-italic">No residents allocated</span>
                            ) : (
                              r.residents.map(res => (
                                <span key={res._id} className="badge bg-light text-dark border me-1">
                                  {res.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleDeleteRoom(r._id)}
                            className="btn btn-outline-danger btn-sm w-100"
                            disabled={r.residents.length > 0}
                          >
                            Delete Room
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKING REQUESTS */}
          {activeTab === 'bookings' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">Resident Room Booking Requests</h5>
              {bookings.length === 0 ? (
                <p className="text-muted small">No booking requests submitted.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Resident</th>
                        <th>Target Room</th>
                        <th>Move-in Date</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b._id}>
                          <td>
                            <div className="fw-bold">{b.resident?.name || 'Unknown'}</div>
                            <span className="small text-muted">{b.resident?.phone}</span>
                          </td>
                          <td>
                            <div className="fw-bold">Room #{b.room?.roomNumber}</div>
                            <span className="small text-muted">₹{b.room?.rentPerMonth}/month</span>
                          </td>
                          <td>{new Date(b.moveInDate).toLocaleDateString()}</td>
                          <td className="small text-muted">{b.message || '-'}</td>
                          <td>
                            <span className={`badge ${b.status === 'approved' ? 'badge-verified' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            {b.status === 'pending' ? (
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => handleBookingAction(b._id, 'approved')}
                                  className="btn btn-sm btn-success"
                                >
                                  Approve & Allocate
                                </button>
                                <button
                                  onClick={() => handleBookingAction(b._id, 'rejected')}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="small text-muted">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENT VERIFICATION */}
          {activeTab === 'verifications' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">Resident ID Proofs & Verification Workflows</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Resident</th>
                      <th>Document</th>
                      <th>Current Status</th>
                      <th>Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.map(r => (
                      <tr key={r._id}>
                        <td>
                          <div className="fw-bold">{r.name}</div>
                          <span className="small text-muted">{r.email}</span>
                        </td>
                        <td>
                          {r.idProof?.filePath ? (
                            <div>
                              <div className="small fw-semibold">{r.idProof.docType}</div>
                              <a
                                href={`http://localhost:5000/${r.idProof.filePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary mt-1"
                              >
                                <i className="bi bi-file-earmark-arrow-down me-1"></i> View Document (1MB)
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted small fst-italic">No file uploaded</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${r.verificationStatus === 'verified' ? 'badge-verified' : r.verificationStatus === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                            {r.verificationStatus}
                          </span>
                        </td>
                        <td className="small text-muted">{r.verificationNote || '-'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              onClick={() => handleVerifyDocument(r._id, 'verified')}
                              className="btn btn-sm btn-success"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(r._id, 'rejected')}
                              className="btn btn-sm btn-outline-danger"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENTS & RENT */}
          {activeTab === 'payments' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">All Rent & Payment Records</h5>
              {payments.length === 0 ? (
                <p className="text-muted small">No payment transactions recorded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Resident</th>
                        <th>Room</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Receipt</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id}>
                          <td className="fw-bold">{p.resident?.name || 'Unknown'}</td>
                          <td>Room #{p.room?.roomNumber || '-'}</td>
                          <td>{p.month}</td>
                          <td className="fw-bold text-success">₹{p.amount.toLocaleString()}</td>
                          <td className="small">{p.paymentMethod}</td>
                          <td>
                            {p.receiptPath ? (
                              <a
                                href={`http://localhost:5000/${p.receiptPath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-secondary"
                              >
                                View Receipt
                              </a>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'paid' ? 'badge-verified' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.status === 'pending' ? (
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => handleVerifyPayment(p._id, 'paid')}
                                  className="btn btn-sm btn-success"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p._id, 'rejected')}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="small text-muted">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">PG Resident Daily Attendance Log</h5>
              {attendance.length === 0 ? (
                <p className="text-muted small">No attendance records logged.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Resident</th>
                        <th>Status</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map(a => (
                        <tr key={a._id}>
                          <td className="fw-bold">{a.date}</td>
                          <td>{a.resident?.name || 'Resident'}</td>
                          <td>
                            <span className={`badge ${a.status === 'Present' ? 'bg-success' : 'bg-warning text-dark'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>{a.checkInTime || '-'}</td>
                          <td>{a.checkOutTime || '-'}</td>
                          <td className="small text-muted">{a.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">Hostel Complaints & Maintenance Desk</h5>
              {complaints.length === 0 ? (
                <p className="text-muted small">No complaints reported.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Resident</th>
                        <th>Issue Title & Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Resolution Note</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c._id}>
                          <td>{c.resident?.name || 'Resident'}</td>
                          <td>
                            <div className="fw-bold">{c.title}</div>
                            <span className="small text-muted">{c.category} - {c.description}</span>
                          </td>
                          <td>
                            <span className={`badge ${c.priority === 'Urgent' || c.priority === 'High' ? 'bg-danger' : 'bg-secondary'}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${c.status === 'resolved' ? 'badge-verified' : c.status === 'in-progress' ? 'bg-info-subtle text-info' : 'badge-pending'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="small">{c.resolutionNote || '-'}</td>
                          <td>
                            <div className="dropdown">
                              <button className="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                                Update
                              </button>
                              <ul className="dropdown-menu">
                                <li><button className="dropdown-item" onClick={() => handleComplaintStatus(c._id, 'in-progress')}>Mark In-Progress</button></li>
                                <li><button className="dropdown-item" onClick={() => handleComplaintStatus(c._id, 'resolved')}>Mark Resolved</button></li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: VISITORS */}
          {activeTab === 'visitors' && (
            <div className="card-custom p-4">
              <h5 className="fw-bold mb-3">Hostel Visitor Register</h5>
              {visitors.length === 0 ? (
                <p className="text-muted small">No visitors recorded.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Visiting Resident</th>
                        <th>Visitor Details</th>
                        <th>Date & Time</th>
                        <th>Purpose</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map(v => (
                        <tr key={v._id}>
                          <td className="fw-bold">{v.resident?.name || 'Resident'}</td>
                          <td>
                            <div className="fw-semibold">{v.visitorName} ({v.relationship})</div>
                            <div className="small text-muted">{v.phone}</div>
                          </td>
                          <td className="small">
                            <div>{v.visitDate}</div>
                            <div className="text-muted">{v.entryTime} - {v.exitTime || 'Inside'}</div>
                          </td>
                          <td className="small">{v.purpose}</td>
                          <td>
                            <span className={`badge ${v.status === 'checked-out' ? 'bg-secondary' : 'bg-success'}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: BROADCASTS */}
          {activeTab === 'broadcasts' && (
            <div className="card-custom p-4" style={{ maxWidth: '600px' }}>
              <h5 className="fw-bold mb-3">Broadcast Announcement to All Residents</h5>
              <form onSubmit={handleBroadcast}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Announcement Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Water tank cleaning tomorrow 2 PM - 5 PM"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Provide complete announcement details..."
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-brand w-100">
                  <i className="bi bi-broadcast me-2"></i> Send Notification to All Residents
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
