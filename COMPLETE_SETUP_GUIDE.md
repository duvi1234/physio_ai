# 🏥 SMAART EMR - Hospital Admin Dashboard System

## 📋 Project Overview

This is a **production-ready hospital admin dashboard system** built with:
- **Frontend**: React 19 + React Router v6 + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Authentication**: JWT (Access + Refresh Tokens)
- **Error Handling**: Comprehensive error boundaries and fallback UIs
- **Real-time Updates**: Toast notifications for all operations

## ✅ Features Implemented

### Dashboard Roles (4)
1. **ADMIN** - Full system management
2. **NURSE** - Patient care and vitals management
3. **CONSULTANT** - Physiotherapy and patient consultation
4. **PATIENT** - Self-service health tracking

### Admin Module Pages (7)
- ✅ Patients List (Create, Read, Update, Delete, Search)
- ✅ Appointments List (Schedule, Confirm, Cancel, Complete)
- ✅ Nurses List (Manage nursing staff)
- ✅ Physios/Consultants List (Manage physiotherapists)
- ✅ Appointment Requests (Approve/Reject public requests)
- ✅ Reports (Analytics dashboard)
- ✅ Settings (System configuration)

### Nurse Module Pages (9)
- ✅ Today's Appointments (View scheduled appointments)
- ✅ Patient Check-In (Record patient arrival)
- ✅ Vitals Intake (Record vital signs)
- ✅ Medical History (View patient history)
- ✅ Upload Documents (Add medical documents)
- ✅ Patient Timeline (View patient activities)
- ✅ Alerts (Critical alerts management)
- ✅ Reports (Performance reports)
- ✅ Profile (Nurse profile management)

### Patient Module Pages (10)
- ✅ My Sessions (View treatment sessions)
- ✅ Pain Assessment (Track pain levels)
- ✅ Treatment Plan (View personalized plan)
- ✅ Exercise Tracker (Monitor home exercises)
- ✅ Postural Assessment (Body posture tracking)
- ✅ Medical Records (View all medical documents)
- ✅ Vitals History (View vital signs trends)
- ✅ Consultation Summaries (View consultation notes)
- ✅ Notifications (Incoming messages)
- ✅ Profile (Personal profile management)

### Authentication Features
- ✅ Login with email/password
- ✅ JWT token management (Access + Refresh)
- ✅ Password reset functionality
- ✅ Change password (authenticated users)
- ✅ Automatic token refresh
- ✅ Role-based access control (RBAC)

### Error Handling & Safety
- ✅ Global ErrorBoundary component
- ✅ 404 fallback for missing API routes
- ✅ Graceful degradation for missing pages
- ✅ Toast notifications for all errors
- ✅ Fallback UI components
- ✅ Comprehensive error logging

### Database Features
- ✅ MongoDB seed data (auto-populates on first run)
- ✅ Models for all entities
- ✅ Relationships between entities
- ✅ Soft deletes for patients
- ✅ Activity logging for admins

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v16+ (LTS recommended)
- MongoDB v5.0+ (local or Atlas)
- npm or yarn

### Backend Setup

1. **Clone and navigate to backend**
```bash
cd smaart-emr-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure MongoDB connection**
Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/smaart-emr
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

**For MongoDB Atlas:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smaart-emr
```

5. **Start the backend server**
```bash
npm run dev
```

Server will run on: `http://localhost:5000`

**Seeded Test Credentials:**
- **Admin**: `admin@smaart-healthcare.com` / `Admin@123456`
- **Nurse**: `emily.johnson@smaart-healthcare.com` / `Nurse@123456`
- **Consultant**: `james.anderson@smaart-healthcare.com` / `Consultant@123456`
- **Patient**: `patient1@example.com` / `Patient@123456`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd smaart-emr-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure API URL** (if backend is on different port)
Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

5. **Start development server**
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 📁 Project Structure

### Backend (`smaart-emr-backend/`)
```
src/
├── modules/              # Business logic modules
│   ├── auth/            # Authentication (login, token refresh)
│   ├── user/            # Base user model
│   ├── admin/           # Admin-specific logic
│   ├── nurse/           # Nurse management
│   ├── consultant/      # Consultant/Physio management
│   ├── patient/         # Patient management
│   ├── appointment/     # Appointment scheduling
│   ├── appointmentRequest/ # Public appointment requests
│   ├── medicalRecords/  # Medical record management
│   ├── alerts/          # Alert system
│   └── notification/    # Notification system
├── config/
│   ├── database.js      # MongoDB connection
│   ├── cors.js          # CORS configuration
│   ├── helmet.js        # Security headers
│   ├── jwt.js           # JWT configuration
│   └── logger.js        # Request logging
├── middlewares/
│   ├── auth.middleware.js      # JWT verification
│   ├── role.middleware.js      # Role-based access
│   ├── error.middleware.js     # Error handling
│   ├── validate.middleware.js  # Input validation
│   └── rateLimiter.js          # Rate limiting
├── utils/
│   ├── asyncHandler.js         # Async error handling
│   ├── seedDatabase.js         # Seed dummy data
│   ├── responseHandler.js      # Standard responses
│   └── auditLogger.js          # Audit logging
├── jobs/
│   ├── appointmentReminder.job.js
│   └── tokenCleanup.job.js
└── server.js / app.js

uploads/               # File uploads directory
```

### Frontend (`smaart-emr-frontend/`)
```
src/
├── pages/               # Page components (organized by role)
│   ├── admin/          # Admin pages
│   ├── nurse/          # Nurse pages
│   ├── patient/        # Patient pages
│   ├── consultant/     # Consultant pages
│   ├── dashboard/      # Dashboard pages
│   ├── auth/           # Login, register, password reset
│   ├── public/         # Public pages (landing, requests)
│   └── medical/        # Medical records
├── components/
│   ├── admin/          # Admin-specific components
│   ├── dashboard/      # Dashboard components
│   ├── ui/             # Reusable UI components
│   ├── ErrorBoundary.jsx
│   └── PageUnderConstruction.jsx
├── layouts/
│   ├── AdminLayout.jsx
│   ├── DashboardLayout.jsx
│   ├── Header.jsx
│   └── Sidebar.jsx
├── context/
│   └── AuthContext.jsx      # Global auth state
├── hooks/
│   ├── useAuth.js           # Auth hook
│   ├── useFetch.js          # Data fetching
│   └── useLocalStorage.js   # Local storage utilities
├── services/
│   ├── api.js               # Axios instance + interceptors
│   ├── auth.service.js      # Auth API calls
│   ├── patient.service.js   # Patient API calls
│   ├── admin.service.js     # Admin API calls
│   └── [role].service.js    # Other services
├── utils/
│   ├── roleRedirect.js      # Role-based routing
│   ├── constants.js
│   └── validators.js
├── router/
│   ├── AppRouter.jsx        # Main router
│   ├── ProtectedRoute.jsx   # Route guard
│   └── DashboardRedirect.jsx
├── App.jsx
└── main.jsx
```

## 🔐 Authentication Flow

### Login Process
```
1. User enters email/password
2. Frontend POSTs to /api/auth/login
3. Backend verifies credentials & generates JWT tokens
4. Frontend stores tokens in localStorage
5. axios interceptor adds token to all subsequent requests
6. User redirected to their dashboard based on role
```

### Token Refresh
```
1. Access token expires (7 days)
2. axios interceptor detects 401 error
3. Automatically sends refresh token to /api/auth/refresh
4. New access token is stored
5. Original request is retried
6. If refresh fails, user is redirected to login
```

## 🛡️ Error Handling Strategy

### Frontend Error Handling
```javascript
// Global ErrorBoundary catches component crashes
<ErrorBoundary>
  <AppRouter />
</ErrorBoundary>

// API errors in services throw to components
try {
  const response = await api.get('/patients');
} catch (error) {
  toast.error(error.response?.data?.message || 'Failed to load');
}
```

### Backend Error Handling
```javascript
// All routes wrapped in asyncHandler
router.get('/patients', asyncHandler(async (req, res) => {
  // Errors thrown here are caught and formatted
}));

// Central error middleware formats all errors
app.use(errorHandler);
```

### Safe Fallbacks
- Missing pages render `PageUnderConstruction` component
- Missing API endpoints return 404 with proper JSON
- Missing user data shows placeholder UI
- Network errors trigger toast notifications

## 🗄️ Database Models

### User (Base Model)
```javascript
- firstName, lastName, email, phone, password
- role (ADMIN, NURSE, CONSULTANT, PATIENT)
- gender, dateOfBirth, profilePhoto
- address (line1, line2, city, state, country, postalCode)
- isVerified, isActive, lastLogin
- loginAttempts, lockUntil, mustChangePassword
```

### Patient (extends User)
```javascript
- bloodGroup
- emergencyContact (name, relationship, phone)
- medicalHistory (allergies, diseases, surgeries, medications)
- assignedNurse, assignedConsultant
- patientStatus, paidStatus
- totalSessionsAllocated, sessionsCompleted
- approvedAt, approvedBy
```

### Nurse (extends User)
```javascript
- licenseNumber, licenseExpiry
- specializations, assignedPatients
- department, shift
- certifications, qualifications
- yearsOfExperience, performanceRating
- isOnDuty
```

### Consultant (extends User)
```javascript
- licenseNumber, licenseExpiry
- specializations, assignedPatients
- department (PHYSIOTHERAPY, ORTHOPEDICS, etc.)
- qualifications, certifications
- yearsOfExperience, performanceRating
- consultationFee, availableSlots
- clinicAddress, isAvailable
```

### Appointment
```javascript
- patient, consultant, nurse
- appointmentDate, startTime, endTime
- status (SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
- appointmentType (CONSULTATION, FOLLOW_UP, THERAPY_SESSION)
- reason, notes, location
- isReminderSent, reminderSentAt
- cancelledAt, cancelledBy, cancellationReason
```

### MedicalRecord
```javascript
- patient, recordDate
- recordType (VITAL_SIGNS, LAB_RESULT, IMAGING, etc.)
- title, description, documentFile
- vitals (bloodPressure, heartRate, temperature, etc.)
- diagnosis (icdCode, condition, severity)
- createdBy, lastModifiedBy
- isConfidential
```

### Alert & Notification
```javascript
- recipient, type, title, message
- severity (LOW, MEDIUM, HIGH, CRITICAL)
- isRead, readAt
- priority, expiresAt
- relatedResourceType, relatedResourceId
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login               - User login
POST   /api/auth/refresh             - Refresh access token
POST   /api/auth/logout              - Logout
POST   /api/auth/forgot-password     - Request password reset
POST   /api/auth/reset-password      - Reset password with token
PATCH  /api/auth/change-password     - Change password (authenticated)
GET    /api/auth/verify-token        - Verify current token
GET    /api/auth/check-admin-exists  - Check if admin is set up
POST   /api/auth/register-admin      - Initial admin registration
```

### Patients
```
GET    /api/patients                 - List all patients (paginated)
GET    /api/patients/:id             - Get specific patient
POST   /api/patients                 - Create patient
PATCH  /api/patients/:id             - Update patient
DELETE /api/patients/:id             - Delete patient (soft delete)
GET    /api/patients/:id/records     - Get patient medical records
GET    /api/patients/:id/appointments- Get patient appointments
PATCH  /api/patients/:id/assign-nurse      - Assign nurse
PATCH  /api/patients/:id/assign-consultant - Assign consultant
```

### Appointments
```
GET    /api/appointments             - List all appointments
GET    /api/appointments/:id         - Get specific appointment
POST   /api/appointments             - Create appointment
PATCH  /api/appointments/:id         - Update appointment
DELETE /api/appointments/:id         - Delete appointment
PATCH  /api/appointments/:id/confirm - Confirm appointment
PATCH  /api/appointments/:id/complete- Mark completed
PATCH  /api/appointments/:id/cancel  - Cancel appointment
```

### Medical Records
```
GET    /api/medical-records          - List records
POST   /api/medical-records          - Create record
GET    /api/medical-records/:id      - Get specific record
PATCH  /api/medical-records/:id      - Update record
DELETE /api/medical-records/:id      - Delete record
```

### Other Modules
```
Nurses:        /api/nurse/*
Consultants:   /api/consultant/*
Requests:      /api/appointment-requests/*
Alerts:        /api/alerts/*
Notifications: /api/notifications/*
```

## 🧪 Testing Login Credentials

**Admin Account**
- Email: `admin@smaart-healthcare.com`
- Password: `Admin@123456`
- Dashboard: `/dashboard/admin`

**Nurse Account**
- Email: `emily.johnson@smaart-healthcare.com`
- Password: `Nurse@123456`
- Dashboard: `/dashboard/nurse`

**Consultant Account**
- Email: `james.anderson@smaart-healthcare.com`
- Password: `Consultant@123456`
- Dashboard: `/dashboard/consultant`

**Patient Account**
- Email: `patient1@example.com`
- Password: `Patient@123456`
- Dashboard: `/dashboard/patient`

## 🐛 Troubleshooting

### Backend issues

**MongoDB Connection Error**
```
❌ Error: connect ECONNREFUSED 127.0.0.1:27017
Fix: Start MongoDB or update MONGO_URI in .env
```

**Port Already in Use**
```
❌ Error: listen EADDRINUSE :::5000
Fix: Change PORT in .env or kill process on port 5000
```

**Seed Data Not Loading**
```
✓ Check if NODE_ENV != "production"
✓ Check MongoDB connection is working
✓ Check user models are properly defined
```

### Frontend issues

**API Connection Error**
```
❌ CORS error or connection refused
Fix: Ensure backend is running on correct port
Fix: Update VITE_API_URL in .env
```

**Login Not Working**
```
✓ Check if backend is running
✓ Verify MongoDB has seeded users
✓ Check browser console for errors
```

**Protected Routes Not Working**
```
✓ Ensure token is stored in localStorage
✓ Check role matches allowed roles in ProtectedRoute
✓ Verify AuthContext is wrapping AppRouter
```

## 📦 Dependencies

### Backend (package.json)
```json
{
  "express": "^4.19.2",
  "mongoose": "^8.3.2",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "dotenv": "^16.4.5",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "node-cron": "^4.2.1",
  "uuid": "^9.0.1"
}
```

### Frontend (package.json)
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.0",
  "axios": "^1.13.5",
  "react-hot-toast": "^2.6.0",
  "tailwindcss": "^3.4.4",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.542.0",
  "recharts": "^3.7.0"
}
```

## 📝 Environment Variables

See `.env.example` files in both directories.

## 🚢 Production Deployment

### Before deploying:

1. **Change JWT secrets** in `.env`
2. **Set NODE_ENV=production** to disable seeding
3. **Update MONGO_URI** to production database
4. **Configure CORS_ORIGIN** for production domain
5. **Set secure cookie options** in auth middleware
6. **Enable HTTPS** for all connections
7. **Set rate limiting** appropriately
8. **Configure email service** for password reset

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates installed
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Error logging enabled
- [ ] Monitoring set up
- [ ] Secrets management in place

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend console logs
3. Check browser console for frontend errors
4. Verify MongoDB connection
5. Check network tab in browser DevTools

## 📄 License

ISC - SMAART Healthcare

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready ✅
