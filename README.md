# 📊 Shramic ERP - Intern Management System

<div align="center">

**A comprehensive full-stack mobile ERP system for efficient intern and employee management**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020?logo=expo)](https://expo.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Mobile App Screens](#-mobile-app-screens)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Shramic ERP** is a modern, full-stack Enterprise Resource Planning system designed specifically for managing interns and employees. It combines a powerful Flask backend with a beautiful React Native mobile application to provide seamless workforce management capabilities.

### 🎪 Live Demo

- **Backend API**: [https://shramicerp.pythonanywhere.com](https://shramicerp.pythonanywhere.com)
- **Admin Panel**: [https://shramicerp.pythonanywhere.com/admin/login](https://shramicerp.pythonanywhere.com/admin/login)
  - Email: `admin@erp.com`
  - Password: `admin123`

### 🏆 Key Highlights

- ✅ **Complete Registration Workflow** - From application to approval
- ✅ **Real-time Attendance Tracking** - GPS-enabled check-in/check-out
- ✅ **Task Management System** - Assignment, submission, and grading
- ✅ **Leave Management** - Application and approval workflow
- ✅ **Certificate Generation** - Automated with verification codes
- ✅ **Announcement Broadcasting** - Priority-based notifications
- ✅ **Goal Tracking** - Personal development monitoring
- ✅ **Dark Mode Support** - Eye-friendly theme switching

---

## ✨ Features

### 👨‍💼 Admin Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard Analytics** | Real-time insights with attendance trends, task statistics, and role distribution charts |
| 👥 **Intern Management** | Comprehensive intern profiles with approval workflow and status tracking |
| ✅ **Approval System** | Review and approve/reject intern registrations with notifications |
| 📅 **Attendance Tracking** | Daily attendance reports, monthly summaries, and CSV export functionality |
| 📋 **Task Assignment** | Create tasks for individuals, roles, or broadcast to all interns |
| 📝 **Submission Review** | Grade submissions (A+, A, B+, B, C) with detailed feedback |
| 🏖️ **Leave Management** | Approve/reject leave requests with admin comments |
| 📢 **Announcements** | Broadcast messages with priority levels (High, Medium, Low) |
| 🎓 **Certificate Generation** | Bulk certificate creation with unique verification codes |
| 💬 **Message Center** | Direct messaging and role-based broadcasting |
| 📊 **Activity Logs** | Complete audit trail of all system activities |
| 📈 **Performance Reviews** | Track intern performance with multiple metrics |

### 📱 Intern Mobile Features

| Feature | Description |
|---------|-------------|
| 🔐 **Registration & Login** | Photo upload, role selection, and pending approval status |
| 🏠 **Dashboard** | Personalized view with tasks, announcements, and quick actions |
| ⏰ **Attendance** | Location-based check-in/check-out with work hours calculation |
| 📋 **Tasks** | View assigned tasks, submit work with file uploads, track status |
| 📊 **Submissions** | Monitor submission status, grades, and feedback |
| 📅 **Leave Requests** | Apply for leave (Sick, Casual, Emergency) with tracking |
| 📢 **Announcements** | Priority-based notifications with modal view |
| 💬 **Messages** | Inbox for admin communications with reply functionality |
| 🎯 **Goals** | Set personal goals and track progress with visual indicators |
| 🎓 **Certificates** | View earned certificates with verification details |
| 👤 **Profile** | Update personal info, change password, upload profile picture |
| 🔔 **Notifications** | Real-time alerts for important updates |
| 🌓 **Theme Toggle** | Switch between light and dark modes |

---

## 🛠️ Technology Stack

### Backend
```python
Framework:        Flask 3.0+
Database:         SQLite (Production: PostgreSQL/MySQL compatible)
Authentication:   Flask-Login with session management
Email:            Flask-Mail (SMTP)
Security:         Werkzeug password hashing
File Handling:    Base64 encoding/decoding
Timezone:         pytz (Asia/Kolkata)
CORS:             Flask-CORS
Deployment:       PythonAnywhere (WSGI)
```

### Frontend (Mobile)
```javascript
Framework:        React Native 0.81.5
Platform:         Expo ~54.0
Navigation:       React Navigation (Stack + Bottom Tabs)
State:            React Context API
Storage:          AsyncStorage
HTTP:             Axios
UI Components:    @expo/vector-icons, react-native-toast-message
Media:            expo-image-picker, expo-document-picker
Styling:          StyleSheet (Inline styles)
Theme:            Custom light/dark themes
```

### Database Schema (15 Tables)
```
├── users                    (Intern/Admin profiles)
├── attendance               (Check-in/out records)
├── tasks                    (Task assignments)
├── submissions              (Task submissions)
├── messages                 (Internal messaging)
├── announcements            (Broadcasts)
├── leave_requests           (Leave applications)
├── certificates             (Generated certificates)
├── document_verifications   (Document uploads)
├── activity_logs            (Audit trail)
├── performance_reviews      (Performance tracking)
├── notifications            (Push notifications)
├── goals                    (Personal goals)
└── skills                   (Skill tracking)
```

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                   Mobile Application                     │
│              (React Native + Expo)                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Dashboard │  │Attendance│  │  Tasks   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Profile  │  │   More   │  │Announcements│          │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────┐
│                    Flask Backend                         │
│                  (Python + SQLite)                       │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  Authentication & Authorization              │      │
│  │  (Flask-Login + Session Management)          │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │   REST    │  │   Admin   │  │   Email   │          │
│  │    API    │  │   Panel   │  │  Service  │          │
│  └───────────┘  └───────────┘  └───────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │         SQLite Database                      │      │
│  │  (Users, Attendance, Tasks, etc.)            │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Project Structure
```
Shramic-ERP/
│
├── app.py                          # Flask backend application
├── shramic_erp.db                  # SQLite database
├── static/
│   └── uploads/                    # File storage
│       ├── profiles/               # Profile pictures
│       ├── tasks/                  # Task files
│       ├── submissions/            # Submission files
│       ├── documents/              # Documents
│       └── certificates/           # Certificates
│
├── templates/                      # Jinja2 templates (Admin panel)
│   └── admin/
│       ├── login.html
│       ├── dashboard.html
│       ├── interns.html
│       └── ...
│
├── App.js                          # React Native root
├── index.js                        # Expo entry point
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── package.json                    # Node dependencies
│
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Card.js
│   │       └── LoadingScreen.js
│   │
│   ├── config/
│   │   └── api.js                  # Axios configuration
│   │
│   ├── constants/
│   │   └── theme.js                # Theme definitions
│   │
│   ├── contexts/
│   │   ├── AuthContext.js          # Authentication state
│   │   └── ThemeContext.js         # Theme state
│   │
│   ├── navigation/
│   │   ├── AppNavigator.js         # Root navigator
│   │   └── InternTabNavigator.js   # Tab navigation
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   └── PendingApprovalScreen.js
│   │   │
│   │   └── intern/
│   │       ├── DashboardScreen.js
│   │       ├── AttendanceScreen.js
│   │       ├── TasksScreen.js
│   │       ├── ProfileScreen.js
│   │       ├── SubmissionsScreen.js
│   │       ├── LeaveScreen.js
│   │       ├── MessagesScreen.js
│   │       ├── GoalsScreen.js
│   │       ├── CertificatesScreen.js
│   │       ├── AnnouncementsScreen.js
│   │       └── NotificationsScreen.js
│   │
│   └── services/
│       ├── authService.js
│       ├── attendanceService.js
│       ├── taskService.js
│       ├── leaveService.js
│       ├── messageService.js
│       ├── goalService.js
│       ├── certificateService.js
│       └── announcementService.js
│
└── assets/
    ├── icon.png
    ├── splash.png
    ├── adaptive-icon.png
    └── favicon.png
```

---

## 📋 Prerequisites

### Backend Requirements
```bash
Python 3.10 or higher
pip (Python package manager)
Virtual environment (recommended)
```

### Frontend Requirements
```bash
Node.js 18.x or higher
npm or yarn
Expo CLI (global installation)
Android Studio (for Android development)
Xcode (for iOS development - macOS only)
```

### Development Tools

- Git
- Code editor (VS Code recommended)
- Postman (for API testing)
- Android Emulator or physical device

---

## 🚀 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/prajwal032004/React-Native-ERP-App.git
cd React-Native-ERP-App
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Install Python Dependencies
```bash
pip install flask flask-cors flask-login flask-mail werkzeug pillow pytz
```

#### 2.3 Initialize Database
```bash
python app.py
# Database will be created automatically on first run
```

The following tables will be created:
- users (with default admin account)
- attendance
- tasks
- submissions
- messages
- announcements
- leave_requests
- certificates
- document_verifications
- activity_logs
- performance_reviews
- notifications
- goals
- skills

### Step 3: Frontend Setup

#### 3.1 Install Node Dependencies
```bash
npm install
# or
yarn install
```

#### 3.2 Install Expo CLI (if not already installed)
```bash
npm install -g expo-cli
# or
npm install -g eas-cli
```

---

## ⚙️ Configuration

### Backend Configuration

#### Environment Variables (Optional)

Create a `.env` file in the root directory:
```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development

# Database
DATABASE=shramic_erp.db

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@erp.com

# CORS Origins (Add your domains)
CORS_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

#### app.py Configuration

Key configurations in `app.py`:
```python
# API Base URL (Update for production)
API_BASE_URL = 'https://shramicerp.pythonanywhere.com'

# Session Configuration
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=365)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True  # Production only

# File Upload Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Timezone
TIMEZONE = pytz.timezone('Asia/Kolkata')
```

### Frontend Configuration

#### src/config/api.js

Update the API base URL:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://shramicerp.pythonanywhere.com';
```

#### app.json

Update app configuration:
```json
{
  "expo": {
    "name": "Shramic ERP",
    "slug": "shramic-erp",
    "version": "1.0.0",
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## 🏃 Running the Application

### Backend (Flask)

#### Development Mode
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Run Flask development server
python app.py

# Server will start on:
# 📊 Admin Panel: http://localhost:5000/admin/login
# 🔌 API Endpoint: http://localhost:5000/api
```

Default admin credentials:
- Email: `admin@erp.com`
- Password: `admin123`

### Frontend (React Native)

#### Start Expo Development Server
```bash
# Start Expo
npm start
# or
expo start

# Options:
# - Press 'a' for Android
# - Press 'i' for iOS
# - Press 'w' for web
# - Scan QR code with Expo Go app
```

#### Run on Android
```bash
npm run android
# or
expo run:android
```

#### Run on iOS (macOS only)
```bash
npm run ios
# or
expo run:ios
```

#### Clear Cache (if needed)
```bash
npm run clear
# or
expo start --clear
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000
Production:  https://shramicerp.pythonanywhere.com
```

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new intern account.

**Request Body:**
```json
{
  "usn": "1CR21CS001",
  "full_name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "password123",
  "role": "Developer",
  "department": "Engineering",
  "photo_data": "data:image/jpeg;base64,..."
}
```

**Response (201):**
```json
{
  "message": "Registration successful! Your Intern ID is SHR-INT-0001. Awaiting admin approval.",
  "intern_id": "SHR-INT-0001"
}
```

#### POST `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "remember": true
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "success": true,
  "user": {
    "id": 1,
    "intern_id": "SHR-INT-0001",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "Developer",
    "status": "APPROVED",
    "is_admin": false,
    "photo_url": "SHR-INT-0001_abc123.png",
    "department": "Engineering"
  }
}
```

#### POST `/api/auth/logout`

Logout current user.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`

Get current authenticated user.

**Response (200):**
```json
{
  "id": 1,
  "intern_id": "SHR-INT-0001",
  "usn": "1CR21CS001",
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "Developer",
  "status": "APPROVED",
  "is_admin": false,
  "photo_url": "SHR-INT-0001_abc123.png",
  "department": "Engineering"
}
```

#### POST `/api/auth/pending-status`

Check registration approval status.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "status": "PENDING",
  "message": "Your account is awaiting admin approval",
  "user": {
    "full_name": "John Doe",
    "intern_id": "SHR-INT-0001",
    "role": "Developer",
    "registered_at": "2026-02-11 10:30:00"
  }
}
```

### Intern Endpoints

#### GET `/api/intern/dashboard`

Get dashboard summary.

**Response (200):**
```json
{
  "tasks": [...],
  "submissions": [...],
  "attendance_count": 20,
  "marked_today": true,
  "announcements": [...],
  "pending_tasks": 5,
  "unread_notifications": 3,
  "goals": [...]
}
```

#### GET `/api/intern/attendance`

Get attendance records.

**Response (200):**
```json
{
  "today_attendance": {
    "id": 1,
    "date": "2026-02-11",
    "check_in_time": "2026-02-11 09:00:00",
    "check_out_time": "2026-02-11 18:00:00",
    "work_hours": 9.0,
    "location": "Office",
    "status": "PRESENT"
  },
  "today_date": "2026-02-11",
  "attendance_this_month": 15,
  "total_hours": 135.5,
  "average_hours": 9.03,
  "working_days": 15,
  "attendance_history": [...]
}
```

#### POST `/api/intern/attendance/mark`

Mark attendance (check-in).

**Request Body:**
```json
{
  "location": "Office - Bengaluru"
}
```

**Response (200):**
```json
{
  "message": "Attendance marked successfully",
  "time": "09:00:00"
}
```

#### POST `/api/intern/attendance/checkout`

Check-out from attendance.

**Response (200):**
```json
{
  "message": "Check-out recorded",
  "time": "18:00:00",
  "work_hours": 9.0
}
```

#### GET `/api/intern/tasks?status=all`

Get assigned tasks.

**Query Parameters:**
- `status`: `all`, `ACTIVE`, `COMPLETED`

**Response (200):**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Complete React Native Module",
      "description": "Implement user authentication",
      "assigned_to": "SHR-INT-0001",
      "deadline": "2026-02-20",
      "priority": "HIGH",
      "status": "ACTIVE",
      "submitted": 0
    }
  ]
}
```

#### POST `/api/intern/submit`

Submit task work.

**Request Body:**
```json
{
  "task_id": 1,
  "content": "Completed authentication module with JWT",
  "file_data": "data:application/pdf;base64,...",
  "file_type": "pdf"
}
```

**Response (201):**
```json
{
  "message": "Submission sent successfully"
}
```

#### GET `/api/intern/submissions?status=all`

Get submission history.

**Query Parameters:**
- `status`: `all`, `PENDING`, `APPROVED`, `REJECTED`

**Response (200):**
```json
{
  "submissions": [
    {
      "id": 1,
      "task_id": 1,
      "task_title": "Complete React Native Module",
      "content": "Completed authentication...",
      "status": "APPROVED",
      "grade": "A+",
      "feedback": "Excellent work!",
      "submitted_at": "2026-02-11 14:30:00",
      "reviewed_by": "Admin",
      "reviewer_name": "System Admin"
    }
  ]
}
```

#### POST `/api/intern/leave`

Apply for leave.

**Request Body:**
```json
{
  "leave_type": "SICK",
  "start_date": "2026-02-15",
  "end_date": "2026-02-16",
  "reason": "Medical appointment"
}
```

**Response (201):**
```json
{
  "message": "Leave request submitted successfully"
}
```

#### GET `/api/intern/leave`

Get leave requests.

**Response (200):**
```json
{
  "leave_requests": [
    {
      "id": 1,
      "leave_type": "SICK",
      "start_date": "2026-02-15",
      "end_date": "2026-02-16",
      "total_days": 2,
      "reason": "Medical appointment",
      "status": "PENDING",
      "admin_comment": null,
      "created_at": "2026-02-11 10:00:00"
    }
  ]
}
```

#### GET `/api/intern/announcements`

Get announcements.

**Response (200):**
```json
{
  "announcements": [
    {
      "id": 1,
      "title": "Office Holiday - Feb 26",
      "content": "Office will be closed for Republic Day",
      "priority": "HIGH",
      "category": "Holiday",
      "created_by_name": "System Admin",
      "created_at": "2026-02-10 15:00:00",
      "expires_at": "2026-02-27 23:59:59"
    }
  ]
}
```

#### GET `/api/intern/messages`

Get inbox messages.

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "sender_name": "System Admin",
      "subject": "Welcome to Shramic ERP",
      "content": "Welcome aboard! ...",
      "is_read": false,
      "created_at": "2026-02-11 09:00:00"
    }
  ]
}
```

#### POST `/api/intern/send-message`

Send message (reply to admin).

**Request Body:**
```json
{
  "recipient_id": 1,
  "subject": "RE: Welcome to Shramic ERP",
  "content": "Thank you for the warm welcome!",
  "parent_id": 1
}
```

**Response (201):**
```json
{
  "message": "Message sent successfully"
}
```

#### GET `/api/intern/goals`

Get personal goals.

**Response (200):**
```json
{
  "goals": [
    {
      "id": 1,
      "title": "Complete React Native Course",
      "description": "Finish Udemy RN course by month end",
      "target_date": "2026-02-28",
      "status": "IN_PROGRESS",
      "progress": 65,
      "created_at": "2026-02-01 10:00:00"
    }
  ]
}
```

#### POST `/api/intern/goals`

Create new goal.

**Request Body:**
```json
{
  "title": "Learn TypeScript",
  "description": "Master TypeScript for React Native",
  "target_date": "2026-03-31"
}
```

**Response (201):**
```json
{
  "message": "Goal created successfully"
}
```

#### PUT `/api/intern/goal/:id`

Update goal progress.

**Request Body:**
```json
{
  "progress": 75,
  "status": "IN_PROGRESS"
}
```

**Response (200):**
```json
{
  "message": "Goal updated"
}
```

#### GET `/api/intern/certificates`

Get earned certificates.

**Response (200):**
```json
{
  "certificates": [
    {
      "id": 1,
      "certificate_type": "INTERNSHIP COMPLETION",
      "certificate_number": "CERT-SHR-20260211143000-A1B2C3D4",
      "verification_code": "A1B2C3D4E5F6G7H8",
      "performance_grade": "A+",
      "issue_date": "2026-02-11",
      "full_name": "John Doe",
      "usn": "1CR21CS001",
      "department": "Engineering",
      "role": "Developer"
    }
  ]
}
```

#### GET `/api/intern/notifications`

Get notifications.

**Response (200):**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Account Approved! 🎉",
      "message": "Your ERP account has been approved.",
      "type": "success",
      "is_read": true,
      "created_at": "2026-02-11 09:00:00"
    }
  ]
}
```

### Admin Endpoints

#### GET `/admin/dashboard`

Admin dashboard (Web UI).

#### GET `/admin/interns`

Manage interns (Web UI).

#### GET `/admin/approvals`

Pending approvals (Web UI).

#### POST `/admin/approve/:id`

Approve intern registration.

#### POST `/admin/reject/:id`

Reject intern registration.

#### GET `/admin/attendance`

View attendance records (Web UI).

#### GET `/admin/tasks`

Manage tasks (Web UI).

#### POST `/admin/tasks`

Create new task.

#### GET `/admin/submissions`

Review submissions (Web UI).

#### POST `/admin/submission/:id/approve`

Approve submission with grade.

#### GET `/admin/leaves`

Manage leave requests (Web UI).

#### POST `/admin/leave/:id/approve`

Approve leave request.

#### GET `/admin/announcements`

Manage announcements (Web UI).

#### POST `/admin/announcements`

Create announcement.

#### GET `/admin/certificates`

Manage certificates (Web UI).

#### POST `/admin/generate-all-certificates`

Generate certificates for all eligible interns.

---

## 🗄️ Database Schema

### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_id TEXT UNIQUE,
    usn TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'PENDING',
    is_admin BOOLEAN DEFAULT 0,
    department TEXT,
    join_date DATE,
    emergency_contact TEXT,
    address TEXT,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### attendance
```sql
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    work_hours REAL,
    location TEXT,
    ip_address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'PRESENT',
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, date)
);
```

### tasks
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    assigned_to TEXT,
    assigned_by INTEGER,
    deadline DATE,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'ACTIVE',
    category TEXT,
    estimated_hours REAL,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

### submissions
```sql
CREATE TABLE submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task_id INTEGER,
    content TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'PENDING',
    version INTEGER DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER,
    feedback TEXT,
    grade TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

### certificates
```sql
CREATE TABLE certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    certificate_type TEXT NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    certificate_number TEXT UNIQUE,
    file_url TEXT,
    verification_code TEXT UNIQUE,
    performance_grade TEXT,
    skills_acquired TEXT,
    projects_completed INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📱 Mobile App Screens

### Authentication Flow

1. **Login Screen**
   - Email/password input
   - Remember me option
   - Register link

2. **Register Screen**
   - Photo upload (camera/gallery)
   - USN, name, phone, email
   - Password (with visibility toggle)
   - Role selection chips
   - Department selection

3. **Pending Approval Screen**
   - Waiting status
   - Intern ID display
   - Refresh status button

### Main App Screens

4. **Dashboard**
   - Welcome header with profile picture
   - Stats cards (Attendance, Tasks, Submissions, Notifications)
   - Quick actions grid
   - Recent tasks list
   - Announcements carousel

5. **Attendance**
   - Today's status card
   - Check-in/Check-out buttons
   - Location input
   - Monthly stats
   - Attendance history
   - Work hours calculation

6. **Tasks**
   - Task list with filters
   - Priority badges
   - Deadline indicators
   - Submit task dialog
   - File upload

7. **Profile**
   - Profile picture with upload
   - Personal information
   - Statistics overview
   - Edit profile form
   - Change password
   - Theme toggle

8. **More** (5 sub-screens)
   - Submissions
   - Leave Requests
   - Messages
   - Goals
   - Certificates

---

## 🚀 Deployment

### Backend Deployment (PythonAnywhere)

#### 1. Create Account

Visit [PythonAnywhere.com](https://www.pythonanywhere.com/) and create a free account.

#### 2. Upload Code
```bash
# Using Git
git clone https://github.com/prajwal032004/React-Native-ERP-App.git

# Or upload files via Files tab
```

#### 3. Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.10 erp-env
workon erp-env
pip install flask flask-cors flask-login flask-mail werkzeug pillow pytz
```

#### 4. Configure Web App

- Go to "Web" tab
- Add new web app
- Choose "Manual configuration"
- Python version: 3.10
- Set source code directory: `/home/yourusername/React-Native-ERP-App`
- Set working directory: `/home/yourusername/React-Native-ERP-App`

#### 5. Configure WSGI File

Edit `/var/www/yourusername_pythonanywhere_com_wsgi.py`:
```python
import sys
import os

# Add your project directory to the sys.path
project_home = '/home/yourusername/React-Native-ERP-App'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# Import app
from app import app as application
```

#### 6. Set Environment Variables

In "Web" tab → "Environment variables":
```
SECRET_KEY=your-production-secret-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

#### 7. Static Files

Configure static files mapping:

- URL: `/uploads/`
- Directory: `/home/yourusername/React-Native-ERP-App/static/uploads/`

#### 8. Reload Web App

Click "Reload" button to apply changes.

### Frontend Deployment

#### Build Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Download APK from Expo dashboard
```

#### Build Production APK
```bash
eas build --platform android --profile production
```

#### Publish to Expo
```bash
# Publish updates
eas update --branch production

# Or publish to Expo Go
expo publish
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Issue: Database not found
```bash
# Solution: Initialize database
python app.py
```

#### Issue: CORS errors
```python
# Solution: Update CORS origins in app.py
CORS(app, origins=['http://localhost:19006', 'your-app-url'])
```

#### Issue: File upload fails
```bash
# Solution: Check upload folder permissions
chmod 755 static/uploads/
```

### Frontend Issues

#### Issue: Cannot connect to API
```javascript
// Solution: Update API base URL in src/config/api.js
const API_BASE_URL = 'https://your-backend-url.com';
```

#### Issue: Expo Go not loading
```bash
# Solution: Clear cache
expo start --clear
```

#### Issue: Build fails
```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: AsyncStorage errors
```bash
# Solution: Rebuild native dependencies
expo prebuild --clean
```

### Common Errors

#### 401 Unauthorized

- Check if user is logged in
- Verify session is not expired
- Check cookie settings

#### 403 Forbidden

- Verify user status is "APPROVED"
- Check admin privileges for admin routes

#### 404 Not Found

- Verify API endpoint exists
- Check route spelling
- Ensure backend is running

#### 500 Server Error

- Check backend logs
- Verify database connection
- Check for missing dependencies

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/React-Native-ERP-App.git
cd React-Native-ERP-App
```

2. **Create a Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**

- Write clean, documented code
- Follow existing code style
- Add comments where necessary
- Test your changes

4. **Commit Changes**
```bash
git add .
git commit -m "Add: Your feature description"
```

5. **Push to GitHub**
```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**

- Go to GitHub repository
- Click "New Pull Request"
- Describe your changes
- Wait for review

### Coding Standards

- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ES6+ syntax
- **React Native**: Functional components with hooks
- **Comments**: Document complex logic
- **Naming**: Use descriptive variable names

---

## 📄 License

This project is licensed under the **MIT License**.
```
MIT License

Copyright (c) 2026 Prajwal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Authors

**Prajwal**
- GitHub: [@prajwal032004](https://github.com/prajwal032004)
- Repository: [React-Native-ERP-App](https://github.com/prajwal032004/React-Native-ERP-App)

---

## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/) - Mobile framework
- [Expo](https://expo.dev/) - Development platform
- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [Axios](https://axios-http.com/) - HTTP client
- [PythonAnywhere](https://www.pythonanywhere.com/) - Hosting platform

---

## 📞 Support

For support, please:

1. Check [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/prajwal032004/React-Native-ERP-App/issues)
3. Create a [new issue](https://github.com/prajwal032004/React-Native-ERP-App/issues/new)

---

## 🗺️ Roadmap

Future enhancements:

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Real-time chat (Socket.IO)
- [ ] Video conferencing integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] iOS app deployment
- [ ] Dark mode auto-detection
- [ ] Biometric authentication
- [ ] Offline mode support
- [ ] PostgreSQL migration
- [ ] Docker containerization
- [ ] CI/CD pipeline

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Prajwal](https://github.com/prajwal032004)

</div>
