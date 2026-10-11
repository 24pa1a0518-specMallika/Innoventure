# Smart PG / Hostel Management System

A full-stack PG & Hostel Management web application built with **React + Vite**, **Bootstrap 5**, **Node.js**, **Express**, and **MongoDB Atlas** (with automatic zero-config local fallback).

Designed with a modern **Navy Blue, Light Blue, and White** color theme.

---

## 🌟 Key Features

### 🔐 Authentication & Roles
- **Separate Resident and PG Owner Signup & Login** with role selection tabs.
- **JWT Authentication** and **bcrypt** password hashing.
- Role-based Protected Routes: `/resident/dashboard` and `/owner/dashboard`.
- Real-time notification drawer with unread alerts count and announcements.

### 👤 Resident Portal (`/resident/dashboard`)
1. **Overview & Analytics**: Current room occupancy, monthly rent, attendance log counter, and active issues summary.
2. **Profile Management**: Personal information, permanent address, and emergency guardian contact.
3. **Govt ID & Document Uploads**: Secure upload for Aadhaar / Passport / ID cards with **strict 1 MB limits** (JPG, PNG, PDF).
4. **Rooms Catalogue & Booking Requests**: Browse all rooms, capacities, rent prices, and submit move-in requests.
5. **Rent Details & Payment History**: Submit rent payments with UPI / Bank transaction IDs and payment receipt uploads.
6. **Attendance Punch**: Daily digital check-in and check-out with timestamps.
7. **Complaints & Helpdesk**: Register categorized tickets (Maintenance, WiFi, Electricity, Food) with priority tracking.
8. **Visitor Records**: Log visitors with arrival time, purpose, and checkout records.
9. **PG Owner Details**: Direct contact card (Phone, Email, PG Name, and Address).

### 🏢 PG Owner Portal (`/owner/dashboard`)
1. **Analytics & Reports**: Total residents, verified residents, bed capacity fill-rate, open tickets, and total collected revenue.
2. **Resident Management**: Complete resident directory with contact details, room allocation status, and ID verification status.
3. **PG Rooms & Bed Allocation**: Add/delete rooms, set capacity, rent, amenities, and manually allocate or deallocate residents.
4. **Booking Approvals**: Review room booking requests and approve them (automatically allocates bed and updates occupancy).
5. **Document Verification**: Securely inspect uploaded resident ID proofs and approve or reject with custom notes.
6. **Rent Payment Verification**: Verify submitted resident payments and mark them as verified or rejected.
7. **Attendance Log**: Inspect daily check-ins across the entire PG.
8. **Complaints & Work Orders**: Track and update complaint statuses (`in-progress`, `resolved`).
9. **Visitor Register**: View visitor entries and checked-out visitors.
10. **Broadcast Announcements**: Send instant broadcast notifications to all residents.

---

## 📁 Project Architecture

```
smartpg/
├── backend/
│   ├── models/
│   │   ├── User.js          # Resident & Owner accounts, ID proofs, verification status
│   │   ├── Room.js          # Room numbers, beds, capacity, rent, amenities
│   │   ├── Booking.js       # Room booking requests and approvals
│   │   ├── Payment.js       # Rent transactions & receipt records
│   │   ├── Attendance.js    # Daily check-in/out logs
│   │   ├── Complaint.js     # Issue tickets & resolutions
│   │   ├── Visitor.js       # Visitor logbook
│   │   └── Notification.js  # Resident alerts & owner broadcasts
│   ├── middleware/
│   │   ├── auth.js          # JWT verification & role authorization
│   │   └── upload.js        # Multer with 1 MB limit and JPG/PNG/PDF validation
│   ├── routes/              # Modular Express REST APIs
│   ├── uploads/             # Secured uploaded documents & receipts
│   ├── server.js            # Server entrypoint with MongoDB Atlas / memory fallback
│   ├── seed.js              # Auto-seeds default demo data
│   ├── .env                 # Port & MongoDB URI config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.js    # Axios instance with JWT interceptors
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   └── TopNavbar.jsx
    │   ├── pages/
    │   │   ├── AuthPage.jsx          # Dual role login & registration
    │   │   ├── ResidentDashboard.jsx # Full-featured resident control panel
    │   │   └── OwnerDashboard.jsx    # Full-featured PG owner control panel
    │   ├── App.jsx
    │   ├── index.css        # Navy & Light Blue styling
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## ⚡ Quick Start & Run Commands

### Prerequisites
- Node.js (v18+) and npm installed.

### Step 1: Start Backend Server
Open a terminal in the root project folder:
```powershell
cd backend
npm install
node server.js
```
The backend server runs on `http://localhost:5000`.

> **Note on MongoDB**: If you have a MongoDB Atlas connection string, open [backend/.env](file:///c:/Users/MALLIKA/projects/smartpg/backend/.env) and set:
> ```env
> MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartpg?retryWrites=true&w=majority
> ```
> If left empty, the application automatically boots an embedded local MongoDB instance, so you can test everything immediately without any external configuration!

### Step 2: Start Frontend Application
Open a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your web browser.

---

## 🔑 Pre-seeded Test Credentials

The database automatically seeds test accounts on first launch:

| Role | Email | Password |
|---|---|---|
| **PG Owner** | `owner@smartpg.com` | `owner123` |
| **Resident** | `resident@smartpg.com` | `resident123` |

You can also use the one-click **"Fill Resident Demo"** and **"Fill Owner Demo"** buttons directly on the login page, or register your own brand-new Resident or Owner account.
