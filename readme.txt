shramic-mobile/
├── package.json
├── babel.config.js
├── app.json
├── .env
├── App.js
└── src/
    ├── config/
    │   └── api.js
    ├── contexts/
    │   ├── AuthContext.js
    │   └── ThemeContext.js
    ├── navigation/
    │   ├── AppNavigator.js
    │   └── InternTabNavigator.js
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── PendingApprovalScreen.js
    │   └── intern/
    │       ├── DashboardScreen.js
    │       ├── AttendanceScreen.js
    │       ├── TasksScreen.js
    │       ├── SubmissionsScreen.js
    │       ├── LeaveScreen.js
    │       ├── MessagesScreen.js
    │       ├── GoalsScreen.js
    │       ├── ProfileScreen.js
    │       └── CertificatesScreen.js
    ├── components/
    │   └── common/
    │       ├── Button.js
    │       ├── Card.js
    │       └── LoadingScreen.js
    ├── services/
    │   ├── authService.js
    │   ├── attendanceService.js
    │   ├── taskService.js
    │   ├── leaveService.js
    │   ├── messageService.js
    │   ├── goalService.js
    │   └── certificateService.js
    └── constants/
        └── theme.js


import os
import sqlite3
import csv
import io
from flask import Flask, request, jsonify, send_from_directory, make_response, render_template, redirect, url_for, flash
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from datetime import datetime, timedelta, date
import base64
import json
import uuid
import hashlib
import secrets
from PIL import Image
import pytz

app = Flask(__name__)

CORS(app,
     supports_credentials=True,
     origins=[
         'http://localhost:3000',
         'https://shramic-erp.vercel.app',
         'https://shramicerp.vercel.app',
         'http://127.0.0.1:8000',
         'http://localhost:19006',  # Expo web
         'exp://192.168.*.*:8081',  # Expo mobile
         '*'  # For development - remove in production
     ],
     allow_headers=['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie', 'X-Requested-With'],
     expose_headers=['Set-Cookie', 'Content-Type'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'static-key-for-development-12345-do-not-change-often')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=365)
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=365)
app.config['REMEMBER_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_NAME'] = 'shramic_session'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') != 'development'
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['SESSION_COOKIE_PATH'] = '/'

UPLOAD_FOLDER = os.path.join('static', 'uploads')
PROFILE_PICS_FOLDER = os.path.join(UPLOAD_FOLDER, 'profiles')
TASK_FILES_FOLDER = os.path.join(UPLOAD_FOLDER, 'tasks')
SUBMISSION_FILES_FOLDER = os.path.join(UPLOAD_FOLDER, 'submissions')
DOCUMENT_FOLDER = os.path.join(UPLOAD_FOLDER, 'documents')
CERTIFICATE_FOLDER = os.path.join(UPLOAD_FOLDER, 'certificates')

for folder in [UPLOAD_FOLDER, PROFILE_PICS_FOLDER, TASK_FILES_FOLDER,
               SUBMISSION_FILES_FOLDER, DOCUMENT_FOLDER, CERTIFICATE_FOLDER]:
    os.makedirs(folder, exist_ok=True)

app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@shramic.com')

mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'
login_manager.session_protection = 'basic'

DATABASE = 'shramic_erp.db'
TIMEZONE = pytz.timezone('Asia/Kolkata')

def get_current_datetime():
    return datetime.now(TIMEZONE)

def get_current_date():
    return get_current_datetime().date()

def format_datetime(dt, format_str='%Y-%m-%d %H:%M:%S'):
    if dt is None: return None
    if isinstance(dt, str): return dt
    return dt.strftime(format_str)

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
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
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
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
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
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
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS submissions (
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
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            recipient_id INTEGER,
            recipient_role TEXT,
            subject TEXT,
            content TEXT NOT NULL,
            is_broadcast BOOLEAN DEFAULT 0,
            is_read BOOLEAN DEFAULT 0,
            parent_message_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (recipient_id) REFERENCES users(id),
            FOREIGN KEY (parent_message_id) REFERENCES messages(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_by INTEGER,
            priority TEXT DEFAULT 'NORMAL',
            category TEXT,
            target_roles TEXT,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            leave_type TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            total_days INTEGER,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            reviewed_by INTEGER,
            reviewed_at TIMESTAMP,
            admin_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS certificates (
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
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS document_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            document_type TEXT NOT NULL,
            document_name TEXT,
            file_url TEXT,
            status TEXT DEFAULT 'PENDING',
            verified_by INTEGER,
            verified_at TIMESTAMP,
            rejection_reason TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (verified_by) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            reviewer_id INTEGER,
            review_period TEXT,
            technical_skills INTEGER,
            communication INTEGER,
            teamwork INTEGER,
            punctuality INTEGER,
            overall_rating REAL,
            strengths TEXT,
            improvements TEXT,
            comments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT,
            link TEXT,
            is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            target_date DATE,
            status TEXT DEFAULT 'IN_PROGRESS',
            progress INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            skill_name TEXT NOT NULL,
            proficiency_level INTEGER,
            verified BOOLEAN DEFAULT 0,
            verified_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (verified_by) REFERENCES users(id)
        )
    ''')

    cur.execute("SELECT * FROM users WHERE email = ?", ('admin@shramic.com',))
    if not cur.fetchone():
        admin_password = generate_password_hash('admin123')
        current_date = format_datetime(get_current_date(), '%Y-%m-%d')
        cur.execute('''
            INSERT INTO users (intern_id, usn, full_name, phone, email, password_hash,
                             role, status, is_admin, department, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('SHR-ADM-0000', 'ADMIN', 'System Admin', '0000000000',
              'admin@shramic.com', admin_password, 'Admin', 'APPROVED', 1,
              'Administration', current_date))

    conn.commit()
    conn.close()

def log_activity(user_id, action, entity_type=None, entity_id=None, details=None):
    try:
        # FIXED: Safely get IP address
        if isinstance(request.remote_addr, dict):
            ip_address = str(request.remote_addr.get('ip', 'Unknown'))
        else:
            ip_address = str(request.remote_addr) if request.remote_addr else 'Unknown'

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, action, entity_type, entity_id, details, ip_address))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Activity log error: {e}")

def create_notification(user_id, title, message, notification_type='info', link=None):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, title, message, notification_type, link))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Notification error: {e}")

def save_file(file_data, folder, prefix=''):
    if not file_data: return None
    try:
        if ',' in file_data:
            header, encoded = file_data.split(',', 1)
        else:
            encoded = file_data

        file_bytes = base64.b64decode(encoded)
        filename = f"{prefix}{uuid.uuid4().hex}.png"
        filepath = os.path.join(folder, filename)

        with open(filepath, 'wb') as f:
            f.write(file_bytes)

        return filename
    except Exception as e:
        print(f"File save error: {e}")
        return None

def calculate_work_hours(check_in, check_out):
    if not check_in or not check_out: return 0
    try:
        check_in_dt = datetime.strptime(check_in, '%Y-%m-%d %H:%M:%S')
        check_out_dt = datetime.strptime(check_out, '%Y-%m-%d %H:%M:%S')
        delta = check_out_dt - check_in_dt
        return round(delta.total_seconds() / 3600, 2)
    except:
        return 0

def generate_certificate_number():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = secrets.token_hex(4).upper()
    return f"CERT-SHR-{timestamp}-{random_part}"

def generate_verification_code():
    return hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16].upper()



class User(UserMixin):
    def __init__(self, user_data):
        self.id = user_data['id']
        self.intern_id = user_data['intern_id']
        self.usn = user_data['usn']
        self.full_name = user_data['full_name']
        self.email = user_data['email']
        self.role = user_data['role']
        self.status = user_data['status']
        self.is_admin = bool(user_data['is_admin'])
        self.photo_url = user_data.get('photo_url')
        self.department = user_data.get('department')

@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_data = cur.fetchone()
    conn.close()
    return User(dict(user_data)) if user_data else None

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin privileges required', 'error')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def approved_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        if current_user.status != 'APPROVED' and not current_user.is_admin:
            return jsonify({'error': 'Account pending approval'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie,Set-Cookie,X-Requested-With")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
# ============================================
# PUBLIC / API ROUTES
# ============================================

@app.route('/')
def index():
    return jsonify({'message': 'Shramic ERP API', 'status': 'running'}), 200

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'database': 'sqlite'}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        usn = data.get('usn', '').upper()
        full_name = data.get('full_name')
        phone = data.get('phone')
        email = data.get('email', '').lower()
        password = data.get('password')
        role = data.get('role')
        department = data.get('department')
        photo_data = data.get('photo_data')

        if not all([usn, full_name, phone, email, password, role]):
            return jsonify({'error': 'All fields are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT * FROM users WHERE usn = ? OR email = ?", (usn, email))
        if cur.fetchone():
            conn.close()
            return jsonify({'error': 'USN or Email already registered'}), 400

        cur.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 0")
        count = cur.fetchone()['count']
        intern_id = f"SHR-INT-{count + 1:04d}"

        photo_filename = None
        if photo_data:
            photo_filename = save_file(photo_data, PROFILE_PICS_FOLDER, f"{intern_id}_")

        password_hash = generate_password_hash(password)
        current_date = format_datetime(get_current_date(), '%Y-%m-%d')

        cur.execute('''
            INSERT INTO users (intern_id, usn, full_name, phone, email, password_hash,
                             role, photo_url, status, department, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (intern_id, usn, full_name, phone, email, password_hash, role,
              photo_filename, 'PENDING', department, current_date))

        conn.commit()
        conn.close()

        return jsonify({
            'message': f'Registration successful! Your Intern ID is {intern_id}. Awaiting admin approval.',
            'intern_id': intern_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        password = data.get('password')
        remember = data.get('remember', False)

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        user_data = cur.fetchone()

        if user_data and check_password_hash(user_data['password_hash'], password):
            # ✨ NEW: Check approval status BEFORE login
            if not user_data['is_admin']:
                if user_data['status'] == 'PENDING':
                    conn.close()
                    return jsonify({
                        'success': False,
                        'error': 'Your account is pending admin approval. Please wait.',
                        'status': 'PENDING'
                    }), 403

                if user_data['status'] == 'REJECTED':
                    conn.close()
                    return jsonify({
                        'success': False,
                        'error': 'Your account registration has been rejected. Please contact admin.',
                        'status': 'REJECTED'
                    }), 403

            # Continue with existing login code
            current_timestamp = format_datetime(get_current_datetime())
            cur.execute('''
                UPDATE users
                SET last_login = ?, login_count = login_count + 1
                WHERE id = ?
            ''', (current_timestamp, user_data['id']))
            conn.commit()

            user = User(dict(user_data))
            login_user(user, remember=remember)

            log_activity(user.id, 'USER_LOGIN')

            conn.close()

            return jsonify({
                'message': 'Login successful',
                'success': True,
                'user': {
                    'id': user.id,
                    'intern_id': user.intern_id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'role': user.role,
                    'status': user.status,
                    'is_admin': user.is_admin,
                    'photo_url': user.photo_url,
                    'department': user.department
                }
            }), 200
        else:
            conn.close()
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def api_logout():
    log_activity(current_user.id, 'USER_LOGOUT')
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth/pending-status', methods=['POST'])
def check_pending_status():
    """Check if a user account is pending approval"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT status, full_name, intern_id, role, created_at FROM users WHERE email = ?", (email,))
        user_data = cur.fetchone()
        conn.close()

        if not user_data:
            return jsonify({'error': 'User not found'}), 404

        user_dict = dict(user_data)

        if user_dict['status'] == 'PENDING':
            return jsonify({
                'status': 'PENDING',
                'message': 'Your account is awaiting admin approval',
                'user': {
                    'full_name': user_dict['full_name'],
                    'intern_id': user_dict['intern_id'],
                    'role': user_dict['role'],
                    'registered_at': user_dict['created_at']
                }
            }), 200
        elif user_dict['status'] == 'APPROVED':
            return jsonify({
                'status': 'APPROVED',
                'message': 'Your account has been approved. You can now login.'
            }), 200
        elif user_dict['status'] == 'REJECTED':
            return jsonify({
                'status': 'REJECTED',
                'message': 'Your account registration was rejected. Please contact admin.'
            }), 403
        else:
            return jsonify({
                'status': user_dict['status'],
                'message': 'Unknown account status'
            }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'intern_id': current_user.intern_id,
        'usn': current_user.usn,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'status': current_user.status,
        'is_admin': current_user.is_admin,
        'photo_url': current_user.photo_url,
        'department': current_user.department
    }), 200

# ============================================
# ADMIN WEB ROUTES (Rendered Templates)
# ============================================

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page and handler"""
    if request.method == 'POST':
        email = request.form.get('email', '').lower()
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ? AND is_admin = 1", (email,))
        user_data = cur.fetchone()

        if user_data and check_password_hash(user_data['password_hash'], password):
            cur.execute('''
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1
                WHERE id = ?
            ''', (user_data['id'],))
            conn.commit()

            user = User(dict(user_data))
            login_user(user, remember=remember)
            log_activity(user.id, 'ADMIN_LOGIN')

            conn.close()
            flash('Welcome back, Admin!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            conn.close()
            flash('Invalid admin credentials', 'error')
            return redirect(url_for('admin_login'))

    return render_template('admin/login.html')

@app.route('/admin/dashboard')
@login_required
@admin_required
def admin_dashboard():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 0")
    total_interns = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM users WHERE status = 'PENDING' AND is_admin = 0")
    pending_interns = cur.fetchone()['count']

    cur.execute("SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = DATE('now', 'localtime')")
    today_attendance = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM submissions WHERE status = 'PENDING'")
    pending_submissions = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM users WHERE status = 'APPROVED' AND is_admin = 0")
    approved_count = cur.fetchone()['count']
    attendance_rate = int((today_attendance / approved_count) * 100) if approved_count > 0 else 0

    dates = []
    counts = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        cur.execute("SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ?", (day,))
        cnt = cur.fetchone()['count']
        dates.append(datetime.strptime(day, '%Y-%m-%d').strftime('%b %d'))
        counts.append(cnt)

    cur.execute("""
        SELECT status, COUNT(*) as count FROM tasks
        GROUP BY status
    """)
    task_rows = cur.fetchall()
    task_labels = [row['status'] for row in task_rows]
    task_data = [row['count'] for row in task_rows]

    cur.execute("""
        SELECT u.id, u.full_name, u.intern_id, u.photo_url, a.check_in_time, a.location
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = DATE('now', 'localtime')
        ORDER BY a.check_in_time DESC LIMIT 6
    """)
    recent_attendance = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT u.id, u.intern_id, u.full_name, u.photo_url, COUNT(s.id) as submissions
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'APPROVED'
        WHERE u.is_admin = 0
        GROUP BY u.id
        ORDER BY submissions DESC
        LIMIT 5
    """)
    top_performers = [dict(row) for row in cur.fetchall()]

    conn.close()

    return render_template('admin/dashboard.html',
        total_interns=total_interns,
        pending_interns=pending_interns,
        today_attendance=today_attendance,
        attendance_rate=attendance_rate,
        pending_submissions=pending_submissions,
        recent_attendance=recent_attendance,
        top_performers=top_performers,
        chart_attendance={'labels': dates, 'data': counts},
        chart_tasks={'labels': task_labels, 'data': task_data},
        now=datetime.now()
    )

@app.route('/admin/analytics')
@login_required
@admin_required
def admin_analytics():
    """Advanced analytics and reporting dashboard"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Attendance Trend (Last 30 days)
    cur.execute("""
        SELECT date, COUNT(DISTINCT user_id) as count
        FROM attendance
        WHERE date >= DATE('now', '-30 days')
        GROUP BY date
        ORDER BY date ASC
    """)
    attendance_trend = [dict(row) for row in cur.fetchall()]

    # Role Distribution
    cur.execute("""
        SELECT role, COUNT(*) as count
        FROM users
        WHERE is_admin = 0 AND status = 'APPROVED'
        GROUP BY role
        ORDER BY count DESC
    """)
    role_distribution = [dict(row) for row in cur.fetchall()]

    # Department Stats
    cur.execute("""
        SELECT department, COUNT(*) as count
        FROM users
        WHERE is_admin = 0 AND status = 'APPROVED'
        GROUP BY department
        ORDER BY count DESC
    """)
    department_stats = [dict(row) for row in cur.fetchall()]

    # Task Statistics
    cur.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active
        FROM tasks
    """)
    task_stats = dict(cur.fetchone())

    # Top Performers by Grade
    cur.execute("""
        SELECT u.id, u.full_name, u.intern_id, u.photo_url,
               AVG(CASE s.grade
                   WHEN 'A+' THEN 10
                   WHEN 'A' THEN 9
                   WHEN 'B+' THEN 8
                   WHEN 'B' THEN 7
                   WHEN 'C' THEN 6
                   ELSE 5
               END) as avg_grade
        FROM users u
        JOIN submissions s ON u.id = s.user_id
        WHERE u.is_admin = 0 AND s.status = 'APPROVED' AND s.grade IS NOT NULL
        GROUP BY u.id
        ORDER BY avg_grade DESC
        LIMIT 10
    """)
    top_performers = [dict(row) for row in cur.fetchall()]

    conn.close()

    return render_template('admin/analytics.html',
                         attendance_trend=attendance_trend,
                         role_distribution=role_distribution,
                         department_stats=department_stats,
                         task_stats=task_stats,
                         top_performers=top_performers,
                         now=datetime.now())

@app.route('/admin/interns')
@login_required
@admin_required
def admin_interns():
    conn = get_db_connection()
    cur = conn.cursor()

    role_filter = request.args.get('role', 'all')
    status_filter = request.args.get('status', 'all')
    department_filter = request.args.get('department', 'all')
    search = request.args.get('search', '')

    query = "SELECT * FROM users WHERE is_admin = 0"
    params = []

    if role_filter != 'all':
        query += " AND role = ?"
        params.append(role_filter)

    if status_filter != 'all':
        query += " AND status = ?"
        params.append(status_filter)

    if department_filter != 'all':
        query += " AND department = ?"
        params.append(department_filter)

    if search:
        query += " AND (full_name LIKE ? OR intern_id LIKE ? OR email LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])

    query += " ORDER BY created_at DESC"

    cur.execute(query, params)
    interns = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT DISTINCT role FROM users WHERE is_admin = 0")
    roles = [r['role'] for r in cur.fetchall()]

    cur.execute("SELECT DISTINCT department FROM users WHERE is_admin = 0 AND department IS NOT NULL")
    departments = [d['department'] for d in cur.fetchall()]

    conn.close()

    return render_template('admin/interns.html',
        interns=interns,
        roles=roles,
        departments=departments,
        now=datetime.now()
    )

@app.route('/admin/intern/<int:intern_id>')
@login_required
@admin_required
def admin_intern_detail(intern_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE id = ?", (intern_id,))
    intern = cur.fetchone()

    if not intern:
        conn.close()
        flash('Intern not found', 'error')
        return redirect(url_for('admin_interns'))

    cur.execute("""
        SELECT * FROM attendance
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 30
    """, (intern_id,))
    attendance_records = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT
            COUNT(*) as total_days,
            SUM(work_hours) as total_hours,
            AVG(work_hours) as avg_hours
        FROM attendance
        WHERE user_id = ? AND check_in_time IS NOT NULL
    """, (intern_id,))
    attendance_stats = dict(cur.fetchone())

    cur.execute("""
        SELECT s.*, t.title as task_title, t.priority
        FROM submissions s
        LEFT JOIN tasks t ON s.task_id = t.id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
    """, (intern_id,))
    submissions = [dict(row) for row in cur.fetchall()]

    # Mock timeline for display
    timeline = []

    conn.close()

    return render_template('admin/intern_detail.html',
        intern=dict(intern),
        attendance_records=attendance_records,
        stats=attendance_stats,
        submissions=submissions,
        timeline=timeline,
        now=datetime.now()
    )

@app.route('/admin/approvals')
@login_required
@admin_required
def admin_approvals():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM users
        WHERE status = 'PENDING' AND is_admin = 0
        ORDER BY created_at DESC
    """)
    pending_interns = [dict(row) for row in cur.fetchall()]

    conn.close()
    return render_template('admin/approvals.html',
                          pending_interns=pending_interns,
                          now=datetime.now())

@app.route('/admin/approve/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def approve_intern(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("UPDATE users SET status = 'APPROVED' WHERE id = ?", (user_id,))
    cur.execute("SELECT email, full_name, intern_id FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()

    conn.commit()

    create_notification(user_id, 'Account Approved! 🎉',
                       'Your Shramic ERP account has been approved. You can now access all features.',
                       'success')

    log_activity(current_user.id, 'APPROVE_INTERN', 'users', user_id, f"Approved {user['intern_id']}")

    conn.close()

    flash('Intern approved successfully!', 'success')
    return redirect(url_for('admin_approvals'))

@app.route('/admin/reject/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def reject_intern(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT intern_id FROM users WHERE id = ?", (user_id,))
    intern = cur.fetchone()

    cur.execute("UPDATE users SET status = 'REJECTED' WHERE id = ?", (user_id,))
    conn.commit()

    log_activity(current_user.id, 'REJECT_INTERN', 'users', user_id, f"Rejected {intern['intern_id']}")

    conn.close()
    flash('Intern rejected', 'success')
    return redirect(url_for('admin_approvals'))

@app.route('/admin/attendance')
@login_required
@admin_required
def admin_attendance():
    conn = get_db_connection()
    cur = conn.cursor()

    date_filter = request.args.get('date', format_datetime(get_current_date(), '%Y-%m-%d'))

    cur.execute("""
        SELECT u.intern_id, u.full_name, u.role, u.photo_url, u.department,
               a.check_in_time, a.check_out_time, a.work_hours, a.location
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = ?
        ORDER BY a.check_in_time DESC
    """, (date_filter,))
    today_attendance = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT u.intern_id, u.full_name, u.role, u.department,
               COUNT(a.id) as days_present,
               SUM(a.work_hours) as total_hours,
               AVG(a.work_hours) as avg_hours
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id
            AND strftime('%Y-%m', a.date) = strftime('%Y-%m', 'now')
        WHERE u.is_admin = 0 AND u.status = 'APPROVED'
        GROUP BY u.id, u.intern_id, u.full_name, u.role, u.department
        ORDER BY days_present DESC
    """)
    monthly_summary = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT u.intern_id, u.full_name, u.role, u.department, u.photo_url, u.id
        FROM users u
        WHERE u.is_admin = 0 AND u.status = 'APPROVED'
        AND u.id NOT IN (
            SELECT user_id FROM attendance WHERE date = ?
        )
    """, (date_filter,))
    absent_today = [dict(row) for row in cur.fetchall()]

    conn.close()

    return render_template('admin/attendance.html',
        today_attendance=today_attendance,
        monthly_summary=monthly_summary,
        absent_today=absent_today,
        date_filter=date_filter,
        now=datetime.now()
    )

@app.route('/admin/tasks', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_tasks():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        assigned_to = request.form.get('assigned_to')
        deadline = request.form.get('deadline')
        priority = request.form.get('priority', 'MEDIUM')
        category = request.form.get('category')
        estimated_hours = request.form.get('estimated_hours')

        cur.execute("""
            INSERT INTO tasks (title, description, assigned_to, assigned_by,
                             deadline, priority, category, estimated_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (title, description, assigned_to, current_user.id, deadline,
              priority, category, estimated_hours))

        task_id = cur.lastrowid
        conn.commit()

        if assigned_to == 'ALL':
            cur.execute("SELECT id FROM users WHERE is_admin = 0 AND status = 'APPROVED'")
            for user in cur.fetchall():
                create_notification(user['id'], 'New Task Assigned', f'Task: {title}', 'info')
        else:
            cur.execute("SELECT id FROM users WHERE intern_id = ? OR role = ?", (assigned_to, assigned_to))
            for user in cur.fetchall():
                create_notification(user['id'], 'New Task Assigned', f'Task: {title}', 'info')

        log_activity(current_user.id, 'CREATE_TASK', 'tasks', task_id, f"Created: {title}")

        conn.close()
        flash('Task created successfully!', 'success')
        return redirect(url_for('admin_tasks'))

    cur.execute("""
        SELECT t.*, u.full_name as created_by_name,
               (SELECT COUNT(*) FROM submissions WHERE task_id = t.id) as submission_count
        FROM tasks t
        JOIN users u ON t.assigned_by = u.id
        ORDER BY t.created_at DESC
    """)
    tasks = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT intern_id, full_name FROM users WHERE is_admin = 0 AND status = 'APPROVED'")
    interns = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT DISTINCT role FROM users WHERE is_admin = 0")
    roles = [r['role'] for r in cur.fetchall()]

    conn.close()

    return render_template('admin/tasks.html',
                          tasks=tasks,
                          interns=interns,
                          roles=roles,
                          now=datetime.now())

@app.route('/admin/task/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
@admin_required
def manage_task(task_id):
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'DELETE':
        cur.execute("SELECT title FROM tasks WHERE id = ?", (task_id,))
        task = cur.fetchone()

        cur.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()

        log_activity(current_user.id, 'DELETE_TASK', 'tasks', task_id, f"Deleted: {task['title']}")

        flash('Task deleted successfully', 'success')
        return redirect(url_for('admin_tasks'))

    elif request.method == 'PUT':
        data = request.get_json()
        status = data.get('status')
        completion_percentage = data.get('completion_percentage')

        cur.execute("""
            UPDATE tasks
            SET status = ?, completion_percentage = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, completion_percentage, task_id))

        conn.commit()
        conn.close()

        log_activity(current_user.id, 'UPDATE_TASK', 'tasks', task_id)

        return jsonify({'message': 'Task updated successfully'}), 200

@app.route('/admin/submissions')
@login_required
@admin_required
def admin_submissions():
    conn = get_db_connection()
    cur = conn.cursor()

    status_filter = request.args.get('status', 'PENDING')

    cur.execute("""
        SELECT s.*, u.intern_id, u.full_name, u.photo_url,
               t.title as task_title
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN tasks t ON s.task_id = t.id
        WHERE s.status = ?
        ORDER BY s.submitted_at DESC
    """, (status_filter,))
    submissions = [dict(row) for row in cur.fetchall()]

    conn.close()
    return render_template('admin/submissions.html',
                          submissions=submissions,
                          now=datetime.now())

@app.route('/admin/submission/<int:submission_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_submission(submission_id):
    feedback = request.form.get('feedback', '')
    grade = request.form.get('grade', 'A')

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id FROM submissions WHERE id = ?", (submission_id,))
    submission = cur.fetchone()

    cur.execute("""
        UPDATE submissions
        SET status = 'APPROVED',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = ?,
            feedback = ?,
            grade = ?
        WHERE id = ?
    """, (current_user.id, feedback, grade, submission_id))

    conn.commit()

    create_notification(submission['user_id'], 'Submission Approved! ✅',
                       f'Your submission has been approved. Grade: {grade}', 'success')

    log_activity(current_user.id, 'APPROVE_SUBMISSION', 'submissions', submission_id)

    conn.close()
    flash('Submission approved successfully!', 'success')
    return redirect(url_for('admin_submissions'))

@app.route('/admin/submission/<int:submission_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_submission(submission_id):
    feedback = request.form.get('feedback', '')

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id FROM submissions WHERE id = ?", (submission_id,))
    submission = cur.fetchone()

    cur.execute("""
        UPDATE submissions
        SET status = 'REJECTED',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = ?,
            feedback = ?
        WHERE id = ?
    """, (current_user.id, feedback, submission_id))

    conn.commit()

    create_notification(submission['user_id'], 'Submission Needs Revision',
                       'Your submission has been reviewed. Please check feedback.', 'warning')

    log_activity(current_user.id, 'REJECT_SUBMISSION', 'submissions', submission_id)

    conn.close()
    flash('Submission rejected with feedback', 'success')
    return redirect(url_for('admin_submissions'))

@app.route('/admin/leaves')
@login_required
@admin_required
def admin_leaves():
    conn = get_db_connection()
    cur = conn.cursor()

    status_filter = request.args.get('status', 'PENDING')

    cur.execute("""
        SELECT l.*, u.intern_id, u.full_name, u.role, u.photo_url
        FROM leave_requests l
        JOIN users u ON l.user_id = u.id
        WHERE l.status = ?
        ORDER BY l.created_at DESC
    """, (status_filter,))
    leave_requests = [dict(row) for row in cur.fetchall()]

    conn.close()
    return render_template('admin/leaves.html',
                          leave_requests=leave_requests,
                          now=datetime.now())

@app.route('/admin/leave/<int:leave_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_leave(leave_id):
    admin_comment = request.form.get('admin_comment', '')

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id FROM leave_requests WHERE id = ?", (leave_id,))
    leave = cur.fetchone()

    cur.execute("""
        UPDATE leave_requests
        SET status = 'APPROVED',
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            admin_comment = ?
        WHERE id = ?
    """, (current_user.id, admin_comment, leave_id))

    conn.commit()

    create_notification(leave['user_id'], 'Leave Approved ✅',
                       'Your leave request has been approved.', 'success')

    log_activity(current_user.id, 'APPROVE_LEAVE', 'leave_requests', leave_id)

    conn.close()
    flash('Leave request approved', 'success')
    return redirect(url_for('admin_leaves'))

@app.route('/admin/leave/<int:leave_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_leave(leave_id):
    admin_comment = request.form.get('admin_comment', '')

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id FROM leave_requests WHERE id = ?", (leave_id,))
    leave = cur.fetchone()

    cur.execute("""
        UPDATE leave_requests
        SET status = 'REJECTED',
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            admin_comment = ?
        WHERE id = ?
    """, (current_user.id, admin_comment, leave_id))

    conn.commit()

    create_notification(leave['user_id'], 'Leave Request Update',
                       f'Leave request rejected. {admin_comment}', 'warning')

    log_activity(current_user.id, 'REJECT_LEAVE', 'leave_requests', leave_id)

    conn.close()
    flash('Leave request rejected', 'success')
    return redirect(url_for('admin_leaves'))

@app.route('/admin/messages')
@app.route('/admin/messages/<int:msg_id>')
@login_required
@admin_required
def admin_messages(msg_id=None):
    """Admin message center"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Get all messages where admin is sender or recipient
    cur.execute("""
        SELECT m.*,
               sender.full_name as sender_name,
               recipient.full_name as recipient_name
        FROM messages m
        LEFT JOIN users sender ON m.sender_id = sender.id
        LEFT JOIN users recipient ON m.recipient_id = recipient.id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.created_at DESC
    """, (current_user.id, current_user.id))
    messages = [dict(row) for row in cur.fetchall()]

    # Get selected message
    selected_msg = None
    if msg_id:
        cur.execute("""
            SELECT m.*,
                   sender.full_name as sender_name,
                   recipient.full_name as recipient_name
            FROM messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users recipient ON m.recipient_id = recipient.id
            WHERE m.id = ?
        """, (msg_id,))
        selected_msg = cur.fetchone()

        if selected_msg:
            selected_msg = dict(selected_msg)
            # Mark as read
            cur.execute("UPDATE messages SET is_read = 1 WHERE id = ?", (msg_id,))
            conn.commit()

    # Get all interns for compose
    cur.execute("SELECT id, full_name, intern_id FROM users WHERE is_admin = 0 AND status = 'APPROVED'")
    interns = [dict(row) for row in cur.fetchall()]

    # Get roles
    cur.execute("SELECT DISTINCT role FROM users WHERE is_admin = 0")
    roles = [r['role'] for r in cur.fetchall()]

    conn.close()

    return render_template('admin/messages.html',
                         messages=messages,
                         selected_msg=selected_msg,
                         interns=interns,
                         roles=roles,
                         now=datetime.now())

@app.route('/admin/send-message', methods=['POST'])
@login_required
@admin_required
def admin_send_message():
    """Send message to intern(s)"""
    conn = get_db_connection()
    cur = conn.cursor()

    recipient_type = request.form.get('recipient_type', 'individual')
    subject = request.form.get('subject')
    content = request.form.get('content')
    parent_id = request.form.get('parent_id')

    if recipient_type == 'individual':
        recipient_id = request.form.get('recipient_id')
        cur.execute("""
            INSERT INTO messages (sender_id, recipient_id, subject, content, parent_message_id)
            VALUES (?, ?, ?, ?, ?)
        """, (current_user.id, recipient_id, subject, content, parent_id))

        create_notification(recipient_id, 'New Message from Admin',
                          f'Subject: {subject}', 'info')

    elif recipient_type == 'role':
        recipient_role = request.form.get('recipient_role')
        cur.execute("SELECT id FROM users WHERE role = ? AND is_admin = 0 AND status = 'APPROVED'",
                   (recipient_role,))
        users = cur.fetchall()

        for user in users:
            cur.execute("""
                INSERT INTO messages (sender_id, recipient_id, recipient_role, subject, content, is_broadcast)
                VALUES (?, ?, ?, ?, ?, 1)
            """, (current_user.id, user['id'], recipient_role, subject, content))

            create_notification(user['id'], 'Broadcast Message',
                              f'Subject: {subject}', 'info')

    else:  # all
        cur.execute("SELECT id FROM users WHERE is_admin = 0 AND status = 'APPROVED'")
        users = cur.fetchall()

        for user in users:
            cur.execute("""
                INSERT INTO messages (sender_id, recipient_id, subject, content, is_broadcast)
                VALUES (?, ?, ?, ?, 1)
            """, (current_user.id, user['id'], subject, content))

            create_notification(user['id'], 'Important Announcement',
                              f'Subject: {subject}', 'info')

    conn.commit()
    log_activity(current_user.id, 'SEND_MESSAGE', 'messages', None, f"To: {recipient_type}")
    conn.close()

    flash('Message sent successfully!', 'success')
    return redirect(url_for('admin_messages'))

@app.route('/admin/announcements', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_announcements():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        priority = request.form.get('priority', 'NORMAL')
        category = request.form.get('category')
        target_roles = request.form.get('target_roles', 'ALL')
        expires_at = request.form.get('expires_at')

        cur.execute("""
            INSERT INTO announcements
            (title, content, created_by, priority, category, target_roles, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (title, content, current_user.id, priority, category, target_roles, expires_at))

        conn.commit()

        cur.execute("SELECT id FROM users WHERE is_admin = 0 AND status = 'APPROVED'")
        for user in cur.fetchall():
            create_notification(user['id'], f'📢 {title}', content, 'info')

        log_activity(current_user.id, 'CREATE_ANNOUNCEMENT', 'announcements')

        conn.close()
        flash('Announcement created successfully!', 'success')
        return redirect(url_for('admin_announcements'))

    cur.execute("""
        SELECT a.*, u.full_name as created_by_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
    """)
    announcements = [dict(row) for row in cur.fetchall()]

    conn.close()
    return render_template('admin/announcements.html',
                          announcements=announcements,
                          now=datetime.now())

@app.route('/admin/announcement/<int:announcement_id>', methods=['POST'])
@login_required
@admin_required
def delete_announcement(announcement_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM announcements WHERE id = ?", (announcement_id,))
    conn.commit()
    conn.close()

    log_activity(current_user.id, 'DELETE_ANNOUNCEMENT', 'announcements', announcement_id)

    flash('Announcement deleted', 'success')
    return redirect(url_for('admin_announcements'))

@app.route('/admin/certificates')
@login_required
@admin_required
def admin_certificates():
    """Certificate management page"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.id, u.intern_id, u.full_name, u.role, u.department, u.usn,
               c.id as cert_id, c.certificate_number, c.issue_date
        FROM users u
        LEFT JOIN certificates c ON u.id = c.user_id
        WHERE u.is_admin = 0 AND u.status = 'APPROVED'
        ORDER BY u.full_name ASC
    """)
    interns = [dict(row) for row in cur.fetchall()]

    conn.close()
    return render_template('admin/certificates.html',
                          interns=interns,
                          now=datetime.now())

@app.route('/admin/generate-all-certificates', methods=['POST'])
@login_required
@admin_required
def admin_generate_all_certificates():
    """Generate certificates for all eligible interns"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Get all approved interns without certificates
    cur.execute("""
        SELECT u.id
        FROM users u
        LEFT JOIN certificates c ON u.id = c.user_id
        WHERE u.is_admin = 0
        AND u.status = 'APPROVED'
        AND c.id IS NULL
    """)
    interns = cur.fetchall()

    count = 0
    today = format_datetime(get_current_date(), '%Y-%m-%d')

    for intern in interns:
        user_id = intern['id']

        # Get project count
        cur.execute("SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND status = 'APPROVED'",
                   (user_id,))
        projects = cur.fetchone()['count']

        cert_number = generate_certificate_number()
        verif_code = generate_verification_code()

        cur.execute("""
            INSERT INTO certificates
            (user_id, certificate_type, certificate_number, verification_code,
             performance_grade, projects_completed, issue_date)
            VALUES (?, 'INTERNSHIP COMPLETION', ?, ?, 'A+', ?, ?)
        """, (user_id, cert_number, verif_code, projects, today))

        create_notification(user_id, 'Certificate Generated! 🎓',
                          'Your internship completion certificate is ready.', 'success')
        count += 1

    conn.commit()
    log_activity(current_user.id, 'BULK_GENERATE_CERTIFICATES', None, None, f"Generated {count} certificates")
    conn.close()

    flash(f'Successfully generated {count} certificates!', 'success')
    return redirect(url_for('admin_certificates'))

@app.route('/admin/delete-certificate/<int:cert_id>', methods=['POST'])
@login_required
@admin_required
def admin_delete_certificate(cert_id):
    """Revoke a certificate"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id, certificate_number FROM certificates WHERE id = ?", (cert_id,))
    cert = cur.fetchone()

    if cert:
        cur.execute("DELETE FROM certificates WHERE id = ?", (cert_id,))
        conn.commit()

        create_notification(cert['user_id'], 'Certificate Revoked',
                          f'Certificate {cert["certificate_number"]} has been revoked.', 'warning')

        log_activity(current_user.id, 'REVOKE_CERTIFICATE', 'certificates', cert_id,
                    f"Cert: {cert['certificate_number']}")

        flash('Certificate revoked successfully', 'success')
    else:
        flash('Certificate not found', 'error')

    conn.close()
    return redirect(url_for('admin_certificates'))

@app.route('/certificate/view/<int:cert_id>')
def view_certificate(cert_id):
    """Public certificate view page"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.*, u.full_name, u.usn, u.intern_id, u.role, u.department, u.join_date
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    """, (cert_id,))
    cert = cur.fetchone()
    conn.close()

    if not cert:
        return jsonify({'error': 'Certificate not found'}), 404

    return render_template('certificate_view.html', cert=dict(cert))

@app.route('/admin/export/attendance-csv')
@login_required
@admin_required
def export_attendance_csv():
    """Export attendance data as CSV"""
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.intern_id, u.full_name, u.role, u.department,
               a.date, a.check_in_time, a.check_out_time, a.work_hours, a.location
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE strftime('%Y-%m', a.date) = ?
        ORDER BY a.date DESC, u.full_name ASC
    """, (month,))

    records = cur.fetchall()
    conn.close()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Intern ID', 'Name', 'Role', 'Department', 'Date',
                    'Check In', 'Check Out', 'Hours', 'Location'])

    for record in records:
        writer.writerow([
            record['intern_id'], record['full_name'], record['role'],
            record['department'], record['date'], record['check_in_time'],
            record['check_out_time'], record['work_hours'], record['location']
        ])

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename=attendance_{month}.csv'

    return response

@app.route('/admin/export/attendance-summary-csv')
@login_required
@admin_required
def export_attendance_summary_csv():
    """Export monthly attendance summary as CSV"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.intern_id, u.full_name, u.role, u.department,
               COUNT(a.id) as days_present,
               SUM(a.work_hours) as total_hours,
               AVG(a.work_hours) as avg_hours
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id
            AND strftime('%Y-%m', a.date) = strftime('%Y-%m', 'now')
        WHERE u.is_admin = 0 AND u.status = 'APPROVED'
        GROUP BY u.id
        ORDER BY days_present DESC
    """)

    records = cur.fetchall()
    conn.close()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Intern ID', 'Name', 'Role', 'Department',
                    'Days Present', 'Total Hours', 'Average Hours'])

    for record in records:
        writer.writerow([
            record['intern_id'], record['full_name'], record['role'],
            record['department'], record['days_present'],
            round(record['total_hours'] or 0, 1),
            round(record['avg_hours'] or 0, 1)
        ])

    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename=attendance_summary.csv'

    return response

@app.route('/logout')
@login_required
def logout():
    """Universal logout for both admin and intern"""
    is_admin = current_user.is_admin
    log_activity(current_user.id, 'USER_LOGOUT')
    logout_user()

    if is_admin:
        flash('Logged out successfully', 'success')
        return redirect(url_for('admin_login'))
    else:
        return jsonify({'message': 'Logged out successfully'}), 200

# ============================================
# INTERN API ROUTES (Keep existing routes)
# ============================================

@app.route('/api/admin/dashboard', methods=['GET'])
@login_required
@admin_required
def api_admin_dashboard():
    """API version of admin dashboard for external apps"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 0")
    total_interns = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM users WHERE status = 'PENDING' AND is_admin = 0")
    pending_interns = cur.fetchone()['count']

    cur.execute("SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = DATE('now', 'localtime')")
    today_attendance = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM submissions WHERE status = 'PENDING'")
    pending_submissions = cur.fetchone()['count']

    cur.execute("SELECT COUNT(*) as count FROM users WHERE status = 'APPROVED' AND is_admin = 0")
    approved_count = cur.fetchone()['count']
    attendance_rate = int((today_attendance / approved_count) * 100) if approved_count > 0 else 0

    dates = []
    counts = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        cur.execute("SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE date = ?", (day,))
        cnt = cur.fetchone()['count']
        dates.append(datetime.strptime(day, '%Y-%m-%d').strftime('%b %d'))
        counts.append(cnt)

    cur.execute("""
        SELECT status, COUNT(*) as count FROM tasks
        GROUP BY status
    """)
    task_rows = cur.fetchall()
    task_labels = [row['status'] for row in task_rows]
    task_data = [row['count'] for row in task_rows]

    cur.execute("""
        SELECT u.id, u.full_name, u.intern_id, u.photo_url, a.check_in_time, a.location
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = DATE('now', 'localtime')
        ORDER BY a.check_in_time DESC LIMIT 6
    """)
    recent_attendance = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT u.id, u.intern_id, u.full_name, u.photo_url, COUNT(s.id) as submissions
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'APPROVED'
        WHERE u.is_admin = 0
        GROUP BY u.id
        ORDER BY submissions DESC
        LIMIT 5
    """)
    top_performers = [dict(row) for row in cur.fetchall()]

    conn.close()

    return jsonify({
        'total_interns': total_interns,
        'pending_interns': pending_interns,
        'today_attendance': today_attendance,
        'attendance_rate': attendance_rate,
        'pending_submissions': pending_submissions,
        'recent_attendance': recent_attendance,
        'top_performers': top_performers,
        'chart_attendance': {'labels': dates, 'data': counts},
        'chart_tasks': {'labels': task_labels, 'data': task_data}
    }), 200

# ============================================
# INTERN API ROUTES
# ============================================

@app.route('/api/intern/dashboard', methods=['GET'])
@login_required
@approved_required
def intern_dashboard():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM tasks
        WHERE (assigned_to = ? OR assigned_to = ? OR assigned_to = 'ALL')
        AND status = 'ACTIVE'
        ORDER BY deadline ASC, created_at DESC
        LIMIT 10
    """, (current_user.intern_id, current_user.role))
    tasks = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT s.*, t.title as task_title
        FROM submissions s
        LEFT JOIN tasks t ON s.task_id = t.id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 5
    """, (current_user.id,))
    submissions = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT COUNT(*) as count
        FROM attendance
        WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    """, (current_user.id,))
    attendance_count = cur.fetchone()['count']

    cur.execute("""
        SELECT * FROM attendance
        WHERE user_id = ? AND date = DATE('now')
    """, (current_user.id,))
    today_attendance = cur.fetchone()

    cur.execute("""
        SELECT * FROM announcements
        WHERE (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        AND (target_roles = 'ALL' OR target_roles LIKE ?)
        ORDER BY priority DESC, created_at DESC
        LIMIT 5
    """, (f'%{current_user.role}%',))
    announcements = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        SELECT COUNT(*) as count
        FROM tasks
        WHERE (assigned_to = ? OR assigned_to = ? OR assigned_to = 'ALL')
        AND status = 'ACTIVE'
    """, (current_user.intern_id, current_user.role))
    pending_tasks = cur.fetchone()['count']

    cur.execute("""
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    """, (current_user.id,))
    unread_notifications = cur.fetchone()['count']

    cur.execute("""
        SELECT * FROM goals
        WHERE user_id = ? AND status = 'IN_PROGRESS'
        ORDER BY target_date ASC
        LIMIT 5
    """, (current_user.id,))
    goals = [dict(row) for row in cur.fetchall()]

    conn.close()

    return jsonify({
        'tasks': tasks,
        'submissions': submissions,
        'attendance_count': attendance_count,
        'marked_today': today_attendance is not None,
        'announcements': announcements,
        'pending_tasks': pending_tasks,
        'unread_notifications': unread_notifications,
        'goals': goals
    }), 200

@app.route('/api/intern/profile', methods=['GET', 'PUT'])
@login_required
@approved_required
def intern_profile():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'PUT':
        data = request.get_json()

        if data.get('update_profile'):
            phone = data.get('phone', '').strip()
            address = data.get('address', '').strip()
            emergency_contact = data.get('emergency_contact', '').strip()
            photo_data = data.get('photo_data')

            if phone:
                cur.execute("UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                           (phone, current_user.id))
            if address:
                cur.execute("UPDATE users SET address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                           (address, current_user.id))
            if emergency_contact:
                cur.execute("UPDATE users SET emergency_contact = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                           (emergency_contact, current_user.id))

            if photo_data:
                timestamp = int(datetime.now().timestamp())
                filename = f"{current_user.intern_id}_{timestamp}.png"
                photo_filename = save_file(photo_data, PROFILE_PICS_FOLDER, '')
                if photo_filename:
                    cur.execute("UPDATE users SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                               (photo_filename, current_user.id))

            conn.commit()
            log_activity(current_user.id, 'UPDATE_PROFILE')

            conn.close()
            return jsonify({'message': 'Profile updated successfully'}), 200

        elif data.get('change_password'):
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')

            cur.execute("SELECT password_hash FROM users WHERE id = ?", (current_user.id,))
            user = cur.fetchone()

            if not check_password_hash(user['password_hash'], current_password):
                conn.close()
                return jsonify({'error': 'Current password is incorrect'}), 400

            if new_password != confirm_password:
                conn.close()
                return jsonify({'error': 'New passwords do not match'}), 400

            if len(new_password) < 6:
                conn.close()
                return jsonify({'error': 'Password must be at least 6 characters'}), 400

            hashed_password = generate_password_hash(new_password)
            cur.execute("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                       (hashed_password, current_user.id))
            conn.commit()
            log_activity(current_user.id, 'CHANGE_PASSWORD')

            conn.close()
            return jsonify({'message': 'Password changed successfully'}), 200

    cur.execute("""
        SELECT id, intern_id, usn, full_name, phone, email, role, status,
               photo_url, department, join_date, address, emergency_contact,
               created_at, updated_at
        FROM users WHERE id = ?
    """, (current_user.id,))
    user = dict(cur.fetchone())

    cur.execute("""
        SELECT
            COUNT(*) as attendance_count,
            COALESCE(SUM(work_hours), 0) as total_hours
        FROM attendance
        WHERE user_id = ?
    """, (current_user.id,))
    attendance_stats = dict(cur.fetchone())

    cur.execute("""
        SELECT
            COUNT(*) as total_submissions,
            COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_submissions
        FROM submissions
        WHERE user_id = ?
    """, (current_user.id,))
    submission_stats = dict(cur.fetchone())

    cur.execute("""
        SELECT COUNT(*) as tasks_completed
        FROM tasks t
        JOIN submissions s ON t.id = s.task_id
        WHERE s.user_id = ? AND s.status = 'APPROVED'
    """, (current_user.id,))
    tasks_stats = dict(cur.fetchone())

    cur.execute("""
        SELECT COUNT(*) as reviews_count
        FROM performance_reviews
        WHERE user_id = ?
    """, (current_user.id,))
    reviews_count = cur.fetchone()['reviews_count']

    stats = {
        'attendance_count': attendance_stats['attendance_count'],
        'total_hours': round(float(attendance_stats['total_hours']), 1),
        'total_submissions': submission_stats['total_submissions'],
        'approved_submissions': submission_stats['approved_submissions'],
        'tasks_completed': tasks_stats['tasks_completed'],
        'reviews_count': reviews_count
    }

    conn.close()

    return jsonify({'user': user, 'stats': stats}), 200

@app.route('/api/intern/send-message', methods=['POST'])
@login_required
@approved_required
def intern_send_message():
    """Send message from intern (usually a reply to admin)"""
    try:
        data = request.get_json()
        recipient_id = data.get('recipient_id')  # Usually admin
        subject = data.get('subject')
        content = data.get('content')
        parent_id = data.get('parent_id')  # If replying to a message

        if not content:
            return jsonify({'error': 'Message content is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # If no recipient specified, send to admin
        if not recipient_id:
            cur.execute("SELECT id FROM users WHERE is_admin = 1 LIMIT 1")
            admin = cur.fetchone()
            if admin:
                recipient_id = admin['id']
            else:
                conn.close()
                return jsonify({'error': 'No admin found to send message to'}), 404

        cur.execute("""
            INSERT INTO messages (sender_id, recipient_id, subject, content, parent_message_id)
            VALUES (?, ?, ?, ?, ?)
        """, (current_user.id, recipient_id, subject, content, parent_id))

        message_id = cur.lastrowid
        conn.commit()

        # Notify recipient
        create_notification(recipient_id, 'New Message',
                          f'From {current_user.full_name}: {subject}', 'info')

        log_activity(current_user.id, 'SEND_MESSAGE', 'messages', message_id)

        conn.close()
        return jsonify({'message': 'Message sent successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/intern/attendance', methods=['GET'])
@login_required
@approved_required
def intern_attendance():
    conn = get_db_connection()
    cur = conn.cursor()

    today = format_datetime(get_current_date(), '%Y-%m-%d')

    cur.execute("""
        SELECT * FROM attendance
        WHERE user_id = ? AND date = ?
    """, (current_user.id, today))
    today_attendance = cur.fetchone()

    cur.execute("""
        SELECT COUNT(*) as count
        FROM attendance
        WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', date('now'))
    """, (current_user.id,))
    attendance_this_month = cur.fetchone()['count']

    cur.execute("""
        SELECT
            COALESCE(SUM(work_hours), 0) as total_hours,
            COALESCE(AVG(work_hours), 0) as average_hours,
            COUNT(*) as working_days
        FROM attendance
        WHERE user_id = ? AND work_hours IS NOT NULL
    """, (current_user.id,))
    hours_stats = dict(cur.fetchone())

    cur.execute("""
        SELECT * FROM attendance
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 30
    """, (current_user.id,))
    attendance_history = [dict(row) for row in cur.fetchall()]

    conn.close()

    return jsonify({
        'today_attendance': dict(today_attendance) if today_attendance else None,
        'today_date': today,
        'attendance_this_month': attendance_this_month,
        'total_hours': hours_stats['total_hours'],
        'average_hours': hours_stats['average_hours'],
        'working_days': hours_stats['working_days'],
        'attendance_history': attendance_history
    }), 200

@app.route('/api/intern/attendance/mark', methods=['POST'])
@login_required
@approved_required
def intern_mark_attendance():
    data = request.get_json()
    today = format_datetime(get_current_date(), '%Y-%m-%d')
    now_time = get_current_datetime()

    # FIXED: Safely extract location as string
    location_data = data.get('location', '')
    if isinstance(location_data, dict):
        # If location is a dict, try to extract meaningful string
        location = location_data.get('name') or location_data.get('address') or str(location_data)
    else:
        location = str(location_data) if location_data else ''

    # FIXED: Safely get IP address as string
    if isinstance(request.remote_addr, dict):
        ip_address = str(request.remote_addr.get('ip', 'Unknown'))
    else:
        ip_address = str(request.remote_addr) if request.remote_addr else 'Unknown'

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM attendance
        WHERE user_id = ? AND date = ?
    """, (current_user.id, today))
    existing = cur.fetchone()

    if existing and existing['check_in_time']:
        conn.close()
        return jsonify({'error': 'Attendance already marked today'}), 400

    now_timestamp = format_datetime(now_time)

    if not existing:
        cur.execute("""
            INSERT INTO attendance (user_id, date, check_in_time, location, ip_address)
            VALUES (?, ?, ?, ?, ?)
        """, (current_user.id, today, now_timestamp, location, ip_address))
    else:
        cur.execute("""
            UPDATE attendance
            SET check_in_time = ?, location = ?, ip_address = ?
            WHERE user_id = ? AND date = ?
        """, (now_timestamp, location, ip_address, current_user.id, today))

    conn.commit()
    log_activity(current_user.id, 'MARK_ATTENDANCE')

    conn.close()

    return jsonify({
        'message': 'Attendance marked successfully',
        'time': now_time.strftime('%H:%M:%S')
    }), 200


@app.route('/api/intern/attendance/checkout', methods=['POST'])
@login_required
@approved_required
def intern_checkout():
    today = format_datetime(get_current_date(), '%Y-%m-%d')
    now_time = get_current_datetime()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT check_in_time FROM attendance
        WHERE user_id = ? AND date = ?
    """, (current_user.id, today))
    record = cur.fetchone()

    if not record:
        conn.close()
        return jsonify({'error': 'Please check in first'}), 400

    now_timestamp = format_datetime(now_time)

    work_hours = calculate_work_hours(record['check_in_time'], now_timestamp)

    cur.execute("""
        UPDATE attendance
        SET check_out_time = ?, work_hours = ?
        WHERE user_id = ? AND date = ?
    """, (now_timestamp, work_hours, current_user.id, today))

    conn.commit()
    log_activity(current_user.id, 'CHECKOUT_ATTENDANCE')

    conn.close()

    return jsonify({
        'message': 'Check-out recorded',
        'time': now_time.strftime('%H:%M:%S'),
        'work_hours': work_hours
    }), 200

@app.route('/api/intern/tasks', methods=['GET'])
@login_required
@approved_required
def intern_tasks():
    conn = get_db_connection()
    cur = conn.cursor()

    status_filter = request.args.get('status', 'all')

    query = """
        SELECT t.*,
               (SELECT COUNT(*) FROM submissions WHERE task_id = t.id AND user_id = ?) as submitted
        FROM tasks t
        WHERE (t.assigned_to = ? OR t.assigned_to = ? OR t.assigned_to = 'ALL')
    """
    params = [current_user.id, current_user.intern_id, current_user.role]

    if status_filter != 'all':
        query += " AND t.status = ?"
        params.append(status_filter)

    query += " ORDER BY t.deadline ASC, t.created_at DESC"

    cur.execute(query, params)
    tasks = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'tasks': tasks}), 200

@app.route('/api/intern/submit', methods=['POST'])
@login_required
@approved_required
def intern_submit():
    data = request.get_json()
    task_id = data.get('task_id')
    content = data.get('content')
    file_data = data.get('file_data')
    file_type = data.get('file_type', 'other')

    file_filename = None
    file_size = 0
    if file_data:
        file_filename = save_file(file_data, SUBMISSION_FILES_FOLDER,
                                 f"{current_user.intern_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_")
        file_size = len(file_data) * 3 // 4

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO submissions (user_id, task_id, content, file_url, file_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (current_user.id, task_id if task_id else None, content,
          file_filename, file_type, file_size))

    conn.commit()
    log_activity(current_user.id, 'SUBMIT_WORK', 'submissions')

    conn.close()
    return jsonify({'message': 'Submission sent successfully'}), 201

@app.route('/api/intern/submissions', methods=['GET'])
@login_required
@approved_required
def intern_submissions():
    conn = get_db_connection()
    cur = conn.cursor()

    status_filter = request.args.get('status', 'all')

    query = """
        SELECT s.*, t.title as task_title, r.full_name as reviewer_name
        FROM submissions s
        LEFT JOIN tasks t ON s.task_id = t.id
        LEFT JOIN users r ON s.reviewed_by = r.id
        WHERE s.user_id = ?
    """
    params = [current_user.id]

    if status_filter != 'all':
        query += " AND s.status = ?"
        params.append(status_filter)

    query += " ORDER BY s.submitted_at DESC"

    cur.execute(query, params)
    submissions = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'submissions': submissions}), 200

@app.route('/api/intern/leave', methods=['GET', 'POST'])
@login_required
@approved_required
def intern_leave():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        data = request.get_json()
        leave_type = data.get('leave_type')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        reason = data.get('reason')

        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        total_days = (end - start).days + 1

        cur.execute("""
            INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (current_user.id, leave_type, start_date, end_date, total_days, reason))

        conn.commit()
        log_activity(current_user.id, 'REQUEST_LEAVE', 'leave_requests')

        conn.close()
        return jsonify({'message': 'Leave request submitted successfully'}), 201

    cur.execute("""
        SELECT l.*, r.full_name as reviewer_name
        FROM leave_requests l
        LEFT JOIN users r ON l.reviewed_by = r.id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
    """, (current_user.id,))
    leave_requests = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'leave_requests': leave_requests}), 200

@app.route('/api/intern/announcements', methods=['GET'])
@login_required
@approved_required
def intern_announcements():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT a.*, u.full_name as created_by_name
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        WHERE (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        AND (a.target_roles = 'ALL' OR a.target_roles LIKE ?)
        ORDER BY a.priority DESC, a.created_at DESC
    """, (f'%{current_user.role}%',))
    announcements = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'announcements': announcements}), 200

@app.route('/api/intern/messages', methods=['GET'])
@login_required
@approved_required
def intern_messages():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT m.*, u.full_name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.recipient_id = ?
        ORDER BY m.created_at DESC
    """, (current_user.id,))
    messages = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'messages': messages}), 200

@app.route('/api/intern/message/<int:message_id>/read', methods=['POST'])
@login_required
@approved_required
def mark_message_read(message_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE messages
        SET is_read = 1
        WHERE id = ? AND recipient_id = ?
    """, (message_id, current_user.id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Message marked as read'}), 200

@app.route('/api/intern/goals', methods=['GET', 'POST'])
@login_required
@approved_required
def intern_goals():
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == 'POST':
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        target_date = data.get('target_date')

        cur.execute("""
            INSERT INTO goals (user_id, title, description, target_date)
            VALUES (?, ?, ?, ?)
        """, (current_user.id, title, description, target_date))
        conn.commit()
        log_activity(current_user.id, 'CREATE_GOAL', 'goals')

        conn.close()
        return jsonify({'message': 'Goal created successfully'}), 201

    cur.execute("""
        SELECT * FROM goals
        WHERE user_id = ?
        ORDER BY
            CASE status
                WHEN 'IN_PROGRESS' THEN 1
                WHEN 'COMPLETED' THEN 2
                ELSE 3
            END,
            target_date ASC
    """, (current_user.id,))
    goals = [dict(row) for row in cur.fetchall()]

    conn.close()
    return jsonify({'goals': goals}), 200

@app.route('/api/intern/goal/<int:goal_id>', methods=['PUT'])
@login_required
@approved_required
def update_goal(goal_id):
    data = request.get_json()
    progress = data.get('progress')
    status = data.get('status')

    conn = get_db_connection()
    cur = conn.cursor()

    update_fields = []
    params = []

    if progress is not None:
        update_fields.append('progress = ?')
        params.append(progress)

    if status:
        update_fields.append('status = ?')
        params.append(status)
        if status == 'COMPLETED':
            update_fields.append('completed_at = CURRENT_TIMESTAMP')

    if update_fields:
        params.extend([goal_id, current_user.id])
        cur.execute(f"""
            UPDATE goals
            SET {', '.join(update_fields)}
            WHERE id = ? AND user_id = ?
        """, params)

        conn.commit()

    conn.close()
    return jsonify({'message': 'Goal updated'}), 200

@app.route('/api/intern/notifications', methods=['GET'])
@login_required
@approved_required
def intern_notifications():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    """, (current_user.id,))
    notifications = [dict(row) for row in cur.fetchall()]

    cur.execute("""
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
    """, (current_user.id,))

    conn.commit()
    conn.close()

    return jsonify({'notifications': notifications}), 200

@app.route('/api/notifications/unread', methods=['GET'])
@login_required
def api_unread_notifications():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    """, (current_user.id,))

    count = cur.fetchone()['count']
    conn.close()

    return jsonify({'count': count}), 200

@app.route('/api/intern/certificates', methods=['GET'])
@login_required
@approved_required
def intern_certificates():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.*, u.full_name, u.usn, u.department, u.role
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.issue_date DESC
    """, (current_user.id,))
    certificates = [dict(row) for row in cur.fetchall()]
    conn.close()
    return jsonify({'certificates': certificates}), 200

@app.route('/api/certificate/<int:cert_id>', methods=['GET'])
def get_certificate(cert_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.*, u.full_name, u.usn, u.intern_id, u.role, u.department, u.join_date
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    """, (cert_id,))
    cert = cur.fetchone()
    conn.close()

    if not cert:
        return jsonify({'error': 'Certificate not found'}), 404
    return jsonify({'certificate': dict(cert)}), 200

@app.route('/api/verify/certificate/<code>', methods=['GET'])
def verify_certificate(code):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.*, u.full_name, u.intern_id, u.role, u.department, u.usn, u.join_date
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        WHERE c.verification_code = ?
    """, (code,))

    cert = cur.fetchone()
    conn.close()

    if cert:
        return jsonify({'verified': True, 'certificate': dict(cert)}), 200
    else:
        return jsonify({'verified': False, 'error': 'Invalid or expired verification code'}), 404

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie,Set-Cookie')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory('static/uploads', filename)

@app.errorhandler(404)
def not_found(e):
    # Return JSON for all paths to avoid missing template errors
    return jsonify({
        'error': 'Resource not found',
        'path': request.path,
        'message': str(e)
    }), 404

@app.errorhandler(500)
def server_error(e):
    # Return JSON for all paths to avoid missing template errors
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB'}), 413

if __name__ == "__main__":
    init_db()
    print("🚀 SHRAMIC ERP SYSTEM - FULL STACK SERVER STARTED")
    print("📊 Admin Panel: http://localhost:5000/admin/login")
    print("🔌 API Endpoint: http://localhost:5000/api")
    app.run(debug=True, host='0.0.0.0', port=5000)        