import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import { TopNavbar } from '../components/TopNavbar';

export const ResidentDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, profile, booking, rent, complaints, attendance, visitors, ownerInfo
  
  // States
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [ownerDetails, setOwnerDetails] = useState(null);
  
  // Forms & Feedback
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [docType, setDocType] = useState('Aadhaar Card');
  const [bookingForm, setBookingForm] = useState({ roomId: '', moveInDate: '', message: '' });
  const [paymentForm, setPaymentForm] = useState({ month: 'October 2026', amount: '', paymentMethod: 'UPI', transactionId: '' });
  const [paymentFile, setPaymentFile] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ title: '', category: 'Maintenance', description: '', priority: 'Medium' });
  const [visitorForm, setVisitorForm] = useState({ visitorName: '', phone: '', relationship: 'Friend', visitDate: '', entryTime: '', purpose: 'Visit' });
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || '',
    address: user?.address || '',
    gender: user?.gender || 'male'
  });

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchInitialData = async () => {
    try {
      const [roomsRes, bookingsRes, paymentsRes, complaintsRes, attendRes, visitorsRes, ownerRes] = await Promise.all([
        API.get('/rooms'),
        API.get('/bookings/my-bookings'),
        API.get('/payments/my-history'),
        API.get('/complaints/my-complaints'),
        API.get('/attendance/my-attendance'),
        API.get('/visitors/my-visitors'),
        API.get('/reports/owner-details')
      ]);

      if (roomsRes.data.success) setRooms(roomsRes.data.rooms);
      if (bookingsRes.data.success) setMyBookings(bookingsRes.data.bookings);
      if (paymentsRes.data.success) setPayments(paymentsRes.data.payments);
      if (complaintsRes.data.success) setComplaints(complaintsRes.data.complaints);
      if (attendRes.data.success) setAttendance(attendRes.data.records);
      if (visitorsRes.data.success) setVisitors(visitorsRes.data.visitors);
      if (ownerRes.data.success) setOwnerDetails(ownerRes.data.owner);
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Document Handler
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      return showMsg('Please select a file to upload.', 'danger');
    }
    if (uploadFile.size > 1024 * 1024) {
      return showMsg('File size exceeds the 1 MB limit! Please choose a smaller file.', 'danger');
    }

    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('docType', docType);

    try {
      const res = await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showMsg(res.data.message);
        setUploadFile(null);
        // Refresh profile
        const profileRes = await API.get('/auth/me');
        if (profileRes.data.success) {
          updateProfile(profileRes.data.user);
        }
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Document upload failed.', 'danger');
    }
  };

  // Submit Booking Request
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/bookings/request', bookingForm);
      if (res.data.success) {
        showMsg(res.data.message);
        setBookingForm({ roomId: '', moveInDate: '', message: '' });
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Booking submission failed.', 'danger');
    }
  };

  // Submit Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount) {
      return showMsg('Amount is required', 'danger');
    }

    const formData = new FormData();
    formData.append('month', paymentForm.month);
    formData.append('amount', paymentForm.amount);
    formData.append('paymentMethod', paymentForm.paymentMethod);
    formData.append('transactionId', paymentForm.transactionId);
    if (paymentFile) {
      if (paymentFile.size > 1024 * 1024) {
        return showMsg('Receipt file exceeds 1 MB limit.', 'danger');
      }
      formData.append('receipt', paymentFile);
    }

    try {
      const res = await API.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showMsg(res.data.message);
        setPaymentForm({ month: 'October 2026', amount: '', paymentMethod: 'UPI', transactionId: '' });
        setPaymentFile(null);
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Payment submission failed.', 'danger');
    }
  };

  // File Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/complaints', complaintForm);
      if (res.data.success) {
        showMsg(res.data.message);
        setComplaintForm({ title: '', category: 'Maintenance', description: '', priority: 'Medium' });
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to file complaint.', 'danger');
    }
  };

  // Record Attendance (Check in / Check out)
  const handleAttendanceAction = async (actionType) => {
    try {
      const res = await API.post(`/attendance/${actionType}`);
      if (res.data.success) {
        showMsg(res.data.message);
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Attendance action failed.', 'danger');
    }
  };

  // Log Visitor
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/visitors', visitorForm);
      if (res.data.success) {
        showMsg(res.data.message);
        setVisitorForm({ visitorName: '', phone: '', relationship: 'Friend', visitDate: '', entryTime: '', purpose: 'Visit' });
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to log visitor.', 'danger');
    }
  };

  // Visitor Check Out
  const handleVisitorCheckout = async (id) => {
    try {
      const res = await API.put(`/visitors/${id}/checkout`);
      if (res.data.success) {
        showMsg(res.data.message);
        fetchInitialData();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to checkout visitor.', 'danger');
    }
  };

  // Update Profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(profileForm);
      if (res.success) {
        showMsg('Personal profile details updated successfully!');
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update profile.', 'danger');
    }
  };

  const assignedRoom = rooms.find(r => r._id === (user?.room?._id || user?.room));

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="sidebar shadow-sm d-none d-lg-flex">
        <div className="p-3 border-bottom d-flex align-items-center gap-2">
          <i className="bi bi-buildings-fill text-primary fs-3"></i>
          <div>
            <h6 className="fw-bold mb-0 text-dark">SmartPG Portal</h6>
            <small className="text-muted">Resident Panel</small>
          </div>
        </div>

        <div className="nav flex-column p-2 mt-2 flex-grow-1">
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-1x2-fill"></i> Overview
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="bi bi-person-badge"></i> Profile & Documents
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <i className="bi bi-door-open-fill"></i> Rooms & Booking
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'rent' ? 'active' : ''}`}
            onClick={() => setActiveTab('rent')}
          >
            <i className="bi bi-credit-card-fill"></i> Rent & Payments
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <i className="bi bi-calendar-check-fill"></i> Daily Attendance
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <i className="bi bi-tools"></i> Complaints & Helpdesk
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => setActiveTab('visitors')}
          >
            <i className="bi bi-people-fill"></i> Visitor Records
          </button>
          <button
            className={`nav-link text-start border-0 bg-transparent ${activeTab === 'ownerInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('ownerInfo')}
          >
            <i className="bi bi-person-lines-fill"></i> PG Owner Details
          </button>
        </div>

        <div className="p-3 border-top bg-light">
          <div className="small text-muted">Verification Status</div>
          <span className={`badge ${user?.verificationStatus === 'verified' ? 'badge-verified' : user?.verificationStatus === 'rejected' ? 'badge-rejected' : 'badge-pending'} mt-1`}>
            {user?.verificationStatus?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <TopNavbar title="Resident Dashboard" />

        <div className="p-3 p-md-4 flex-grow-1 overflow-auto">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm`} role="alert">
              <i className="bi bi-info-circle-fill me-2"></i> {message.text}
            </div>
          )}

          {/* Quick Tab Selector for Mobile */}
          <div className="d-lg-none mb-3 overflow-auto d-flex gap-2 pb-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'profile', label: 'Profile' },
              { id: 'booking', label: 'Book Room' },
              { id: 'rent', label: 'Rent' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'complaints', label: 'Complaints' },
              { id: 'visitors', label: 'Visitors' },
              { id: 'ownerInfo', label: 'Owner Info' }
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

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Hero Banner */}
              <div className="hero-banner mb-4 shadow-sm">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h2 className="fw-bold mb-2">Welcome, {user?.name}! 👋</h2>
                    <p className="mb-3 text-light opacity-90">
                      Stay connected with your PG community. Check your rent status, track attendance, and report issues instantly.
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                        <i className="bi bi-door-closed me-1"></i> Room: {assignedRoom ? `Room ${assignedRoom.roomNumber} (${assignedRoom.roomType})` : 'Not Allocated Yet'}
                      </span>
                      <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                        <i className="bi bi-patch-check-fill text-primary me-1"></i> ID Proof: {user?.verificationStatus?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <button onClick={() => setActiveTab('booking')} className="btn btn-light fw-semibold shadow-sm me-2">
                      <i className="bi bi-search me-1"></i> Browse Rooms
                    </button>
                    <button onClick={() => setActiveTab('rent')} className="btn btn-outline-light fw-semibold">
                      <i className="bi bi-wallet2 me-1"></i> Pay Rent
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stat Cards */}
              <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                      <i className="bi bi-house-door-fill"></i>
                    </div>
                    <div>
                      <div className="text-muted small">My Room</div>
                      <h5 className="fw-bold mb-0">{assignedRoom ? `#${assignedRoom.roomNumber}` : 'None'}</h5>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-success-subtle text-success">
                      <i className="bi bi-currency-rupee"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Monthly Rent</div>
                      <h5 className="fw-bold mb-0">₹{assignedRoom ? assignedRoom.rentPerMonth.toLocaleString() : '0'}</h5>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-warning-subtle text-warning">
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Attendance Logged</div>
                      <h5 className="fw-bold mb-0">{attendance.length} Days</h5>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="card-custom p-3 d-flex align-items-center gap-3">
                    <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                      <i className="bi bi-exclamation-circle-fill"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Active Complaints</div>
                      <h5 className="fw-bold mb-0">{complaints.filter(c => c.status !== 'resolved').length}</h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room details & Quick Actions */}
              <div className="row g-4">
                <div className="col-lg-7">
                  <div className="card-custom p-4 mb-4">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle text-primary"></i> Current Room Details
                    </h5>
                    {assignedRoom ? (
                      <div>
                        <div className="row g-3">
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Room Number</span>
                            <div className="fw-bold">{assignedRoom.roomNumber}</div>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Floor</span>
                            <div className="fw-bold">Floor {assignedRoom.floor}</div>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Type</span>
                            <div className="fw-bold">{assignedRoom.roomType}</div>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Capacity</span>
                            <div className="fw-bold">{assignedRoom.capacity} Beds</div>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Monthly Rent</span>
                            <div className="fw-bold text-success">₹{assignedRoom.rentPerMonth} / month</div>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted small">Status</span>
                            <div><span className="badge bg-success-subtle text-success">Allocated</span></div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-muted small d-block mb-1">Amenities Included:</span>
                          <div className="d-flex flex-wrap gap-1">
                            {assignedRoom.amenities?.map((a, idx) => (
                              <span key={idx} className="badge bg-light text-dark border">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-light rounded-3">
                        <i className="bi bi-door-closed display-4 text-muted mb-2"></i>
                        <p className="text-muted mb-2">You do not have an allocated room yet.</p>
                        <button onClick={() => setActiveTab('booking')} className="btn btn-brand btn-sm">
                          Request a Room Allocation
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recent Payments */}
                  <div className="card-custom p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Recent Rent History</h5>
                      <button onClick={() => setActiveTab('rent')} className="btn btn-link btn-sm text-decoration-none">
                        View All
                      </button>
                    </div>
                    {payments.length === 0 ? (
                      <p className="text-muted small">No payment records found.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Month</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.slice(0, 3).map(p => (
                              <tr key={p._id}>
                                <td className="fw-semibold">{p.month}</td>
                                <td>₹{p.amount}</td>
                                <td>{p.paymentMethod}</td>
                                <td>
                                  <span className={`badge ${p.status === 'paid' ? 'badge-verified' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Attendance & Quick check-in */}
                <div className="col-lg-5">
                  <div className="card-custom p-4 mb-4">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-clock-history text-primary"></i> Daily Check-in & Punch
                    </h5>
                    <p className="small text-muted">
                      Mark your presence or punch daily entry/exit times easily:
                    </p>
                    <div className="d-grid gap-2">
                      <button onClick={() => handleAttendanceAction('checkin')} className="btn btn-success">
                        <i className="bi bi-box-arrow-in-right me-2"></i> Punch Daily Check-In
                      </button>
                      <button onClick={() => handleAttendanceAction('checkout')} className="btn btn-outline-secondary">
                        <i className="bi bi-box-arrow-right me-2"></i> Punch Check-Out
                      </button>
                    </div>
                  </div>

                  <div className="card-custom p-4">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check text-success"></i> Verification Checklist
                    </h5>
                    <ul className="list-group list-group-flush small">
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Profile Basic Info</span>
                        <span className="badge bg-success"><i className="bi bi-check"></i> Complete</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Govt ID Upload (≤ 1MB)</span>
                        <span className={`badge ${user?.idProof?.filePath || user?.idProof?.fileName ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {user?.idProof?.filePath || user?.idProof?.fileName ? 'Uploaded' : 'Pending'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        <span>Owner Approval</span>
                        <span className={`badge ${user?.verificationStatus === 'verified' ? 'bg-success' : 'bg-secondary'}`}>
                          {user?.verificationStatus}
                        </span>
                      </li>
                    </ul>
                    <button onClick={() => setActiveTab('profile')} className="btn btn-sm btn-outline-primary w-100 mt-3">
                      Manage Verification Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & DOCUMENT UPLOAD */}
          {activeTab === 'profile' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Personal Profile Information</h5>
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Email (Permanent)</label>
                        <input type="email" className="form-control bg-light" value={user?.email || ''} disabled />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Emergency Contact & Guardian</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 9988776655 (Parent)"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Permanent Home Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-brand">Save Changes</button>
                  </form>
                </div>
              </div>

              {/* Secure Document Upload Section */}
              <div className="col-lg-6">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Govt ID Proof & Document Verification</h5>
                  <p className="small text-muted">
                    Upload your Aadhaar card, Passport, or College/Work ID proof. Allowed file types: <strong>JPG, PNG, PDF</strong> (Maximum size: <strong>1 MB</strong>).
                  </p>

                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Current Verification Status:</span>
                      <span className={`badge ${user?.verificationStatus === 'verified' ? 'badge-verified' : user?.verificationStatus === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {user?.verificationStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    {user?.verificationNote && (
                      <div className="small text-secondary mt-1">
                        <strong>Owner Note:</strong> {user.verificationNote}
                      </div>
                    )}
                    {user?.idProof?.fileName && (
                      <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="small text-dark">
                          <i className="bi bi-file-earmark-pdf text-danger me-1"></i> {user.idProof.fileName} ({user.idProof.docType})
                        </span>
                        {user.idProof.filePath && (
                          <a
                            href={`http://localhost:5000/${user.idProof.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i> View Doc
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleUploadDoc}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Document Type</label>
                      <select
                        className="form-select"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="College/Company ID">College / Company ID</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Select File (JPG, PNG, PDF &le; 1 MB)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        required
                      />
                      {uploadFile && (
                        <div className="form-text small mt-1">
                          File: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i> Upload Document for Verification
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOMS & BOOKING */}
          {activeTab === 'booking' && (
            <div>
              <div className="card-custom p-4 mb-4">
                <h5 className="fw-bold mb-3">Request a PG Room Booking</h5>
                <form onSubmit={handleBookingSubmit}>
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label small fw-semibold">Select Room</label>
                      <select
                        className="form-select"
                        value={bookingForm.roomId}
                        onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Available Room --</option>
                        {rooms.map(r => (
                          <option
                            key={r._id}
                            value={r._id}
                            disabled={r.residents.length >= r.capacity}
                          >
                            Room {r.roomNumber} - {r.roomType} (₹{r.rentPerMonth}/mo) - {r.capacity - r.residents.length} bed(s) free
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Preferred Move-in Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={bookingForm.moveInDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, moveInDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Message / Request Details</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Need ground floor if possible"
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-brand mt-3">
                    Submit Booking Request
                  </button>
                </form>
              </div>

              {/* My Booking Requests */}
              <div className="card-custom p-4 mb-4">
                <h5 className="fw-bold mb-3">My Booking Requests</h5>
                {myBookings.length === 0 ? (
                  <p className="text-muted small">No booking requests submitted yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Room</th>
                          <th>Move-in Date</th>
                          <th>Status</th>
                          <th>Owner Note</th>
                          <th>Requested On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myBookings.map(b => (
                          <tr key={b._id}>
                            <td className="fw-bold">Room {b.room?.roomNumber} ({b.room?.roomType})</td>
                            <td>{new Date(b.moveInDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${b.status === 'approved' ? 'badge-verified' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>{b.ownerNote || '-'}</td>
                            <td className="text-muted small">{new Date(b.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Available Rooms Catalogue */}
              <h5 className="fw-bold mb-3">All PG Rooms Available</h5>
              <div className="row g-3">
                {rooms.map(room => (
                  <div key={room._id} className="col-md-6 col-xl-4">
                    <div className="card-custom p-3 h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="fw-bold mb-0">Room #{room.roomNumber}</h5>
                          <span className={`badge ${room.residents.length >= room.capacity ? 'bg-danger' : 'bg-success'}`}>
                            {room.residents.length >= room.capacity ? 'Full' : `${room.capacity - room.residents.length} Bed(s) Available`}
                          </span>
                        </div>
                        <div className="text-primary fw-bold fs-5 mb-2">
                          ₹{room.rentPerMonth.toLocaleString()} <span className="small text-muted fw-normal">/ month</span>
                        </div>
                        <div className="small text-muted mb-2">
                          <div><strong>Type:</strong> {room.roomType} (Floor {room.floor})</div>
                          <div><strong>Capacity:</strong> {room.capacity} Residents</div>
                        </div>
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          {room.amenities.map((am, i) => (
                            <span key={i} className="badge bg-light text-secondary border" style={{ fontSize: '0.75rem' }}>{am}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-primary btn-sm w-100"
                        disabled={room.residents.length >= room.capacity}
                        onClick={() => {
                          setBookingForm({ ...bookingForm, roomId: room._id });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {room.residents.length >= room.capacity ? 'Fully Occupied' : 'Select for Booking'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RENT & PAYMENTS */}
          {activeTab === 'rent' && (
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Submit Monthly Rent Payment</h5>
                  {assignedRoom ? (
                    <div className="alert alert-info py-2 small mb-3">
                      <strong>Assigned Room:</strong> #{assignedRoom.roomNumber} (Rent: ₹{assignedRoom.rentPerMonth}/month)
                    </div>
                  ) : (
                    <div className="alert alert-warning py-2 small mb-3">
                      Please note: You are not yet allocated to any room. You can book a room first.
                    </div>
                  )}

                  <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Billing Month</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. October 2026"
                        value={paymentForm.month}
                        onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Amount (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={assignedRoom ? String(assignedRoom.rentPerMonth) : 'Amount'}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Payment Method</label>
                      <select
                        className="form-select"
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Transaction Reference / UTR ID</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. UPI3948291038"
                        value={paymentForm.transactionId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Payment Receipt Screenshot (Optional &le; 1MB)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setPaymentFile(e.target.files[0])}
                      />
                    </div>
                    <button type="submit" disabled={!assignedRoom} className="btn btn-brand w-100">
                      Submit Payment Record
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">My Rent & Payment Records</h5>
                  {payments.length === 0 ? (
                    <p className="text-muted small">No payment records logged yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Txn ID</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p._id}>
                              <td className="fw-bold">{p.month}</td>
                              <td className="text-success fw-semibold">₹{p.amount.toLocaleString()}</td>
                              <td>{p.paymentMethod}</td>
                              <td className="small font-monospace">{p.transactionId || '-'}</td>
                              <td>
                                <span className={`badge ${p.status === 'paid' ? 'badge-verified' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="card-custom p-4 text-center">
                  <h5 className="fw-bold mb-3">Daily Attendance Punch</h5>
                  <i className="bi bi-person-check-fill display-3 text-primary mb-3"></i>
                  <p className="small text-muted mb-4">
                    Record your attendance daily to keep PG management informed.
                  </p>
                  <div className="d-grid gap-2">
                    <button onClick={() => handleAttendanceAction('checkin')} className="btn btn-success py-2">
                      <i className="bi bi-box-arrow-in-right me-1"></i> Punch Daily Check-In
                    </button>
                    <button onClick={() => handleAttendanceAction('checkout')} className="btn btn-outline-danger py-2">
                      <i className="bi bi-box-arrow-right me-1"></i> Punch Check-Out
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">My Recent Attendance History</h5>
                  {attendance.length === 0 ? (
                    <p className="text-muted small">No attendance records logged yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map(a => (
                            <tr key={a._id}>
                              <td className="fw-bold">{a.date}</td>
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
              </div>
            </div>
          )}

          {/* TAB 6: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Register a Maintenance Complaint</h5>
                  <form onSubmit={handleComplaintSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Complaint Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. WiFi issue in Room 101"
                        value={complaintForm.title}
                        onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Category</label>
                        <select
                          className="form-select"
                          value={complaintForm.category}
                          onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                        >
                          <option value="Maintenance">Maintenance</option>
                          <option value="Cleanliness">Cleanliness</option>
                          <option value="WiFi/Internet">WiFi / Internet</option>
                          <option value="Food/Mess">Food / Mess</option>
                          <option value="Electricity/Water">Electricity / Water</option>
                          <option value="Security">Security</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Priority</label>
                        <select
                          className="form-select"
                          value={complaintForm.priority}
                          onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Detailed Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Provide details about the issue..."
                        value={complaintForm.description}
                        onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-brand w-100">
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Complaint Tickets & Status</h5>
                  {complaints.length === 0 ? (
                    <p className="text-muted small">No complaints reported yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Title & Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Resolution Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complaints.map(c => (
                            <tr key={c._id}>
                              <td>
                                <div className="fw-bold">{c.title}</div>
                                <span className="small text-muted">{c.category}</span>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: VISITORS */}
          {activeTab === 'visitors' && (
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Log a Visitor</h5>
                  <form onSubmit={handleVisitorSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Visitor Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Ramesh Kumar"
                        value={visitorForm.visitorName}
                        onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="+91 9876543210"
                          value={visitorForm.phone}
                          onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Relationship</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Friend / Sibling"
                          value={visitorForm.relationship}
                          onChange={(e) => setVisitorForm({ ...visitorForm, relationship: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Visit Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={visitorForm.visitDate}
                          onChange={(e) => setVisitorForm({ ...visitorForm, visitDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Entry Time</label>
                        <input
                          type="time"
                          className="form-control"
                          value={visitorForm.entryTime}
                          onChange={(e) => setVisitorForm({ ...visitorForm, entryTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Purpose</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Study, Family visit"
                        value={visitorForm.purpose}
                        onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-brand w-100">
                      Record Visitor Log
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card-custom p-4">
                  <h5 className="fw-bold mb-3">Visitor Logs</h5>
                  {visitors.length === 0 ? (
                    <p className="text-muted small">No visitor logs recorded yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Visitor</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map(v => (
                            <tr key={v._id}>
                              <td>
                                <div className="fw-bold">{v.visitorName}</div>
                                <span className="small text-muted">{v.phone} ({v.relationship})</span>
                              </td>
                              <td className="small">
                                <div>{v.visitDate}</div>
                                <div className="text-muted">{v.entryTime} - {v.exitTime || 'Ongoing'}</div>
                              </td>
                              <td>
                                <span className={`badge ${v.status === 'checked-out' ? 'bg-secondary' : 'bg-success'}`}>
                                  {v.status}
                                </span>
                              </td>
                              <td>
                                {v.status === 'active' && (
                                  <button
                                    onClick={() => handleVisitorCheckout(v._id)}
                                    className="btn btn-sm btn-outline-danger"
                                  >
                                    Check Out
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: OWNER DETAILS */}
          {activeTab === 'ownerInfo' && (
            <div className="card-custom p-4" style={{ maxWidth: '650px' }}>
              <h5 className="fw-bold mb-3">PG Owner & Hostel Management Contact</h5>
              {ownerDetails ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
                    <div className="stat-icon-wrapper bg-primary text-white fs-3">
                      <i className="bi bi-person-badge-fill"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">{ownerDetails.name}</h5>
                      <span className="badge bg-primary-subtle text-primary">PG Owner / Warden</span>
                    </div>
                  </div>

                  <ul className="list-group list-group-flush mb-4">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">PG Name:</span>
                      <strong className="text-dark">{ownerDetails.pgName || 'Smart Living PG'}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Contact Phone:</span>
                      <strong className="text-primary">{ownerDetails.phone}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Email Address:</span>
                      <strong className="text-dark">{ownerDetails.email}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">PG Address:</span>
                      <span className="text-end text-dark">{ownerDetails.pgAddress || 'HSR Layout, Bangalore'}</span>
                    </li>
                  </ul>

                  <div className="d-flex gap-2">
                    <a href={`tel:${ownerDetails.phone}`} className="btn btn-success flex-fill">
                      <i className="bi bi-telephone-fill me-2"></i> Call Owner
                    </a>
                    <a href={`mailto:${ownerDetails.email}`} className="btn btn-outline-primary flex-fill">
                      <i className="bi bi-envelope-fill me-2"></i> Send Email
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-muted">Loading owner contact info...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
