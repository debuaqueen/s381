# Student Manager – COMPS381F Final Project

### 1. Project Information
- **Project Name**: Student Manager (Full-Stack CRUD + Secure Authentication)
- **Course**: COMPS381F
- **Group Number**: Group 4
- **Members**:
  - Wong Yan Ho      (SID: 1367915)
  - Kwan Wai Lam     (SID: 13701745)
  - Wu Yu Hei        (SID: 13024164)
  - Li Lok Yiu       (SID: 13512448)
  - Ning Rui Qi      (SID: 13053319)

### 2. Project Features
- Full **CRUD** operations for student records (Create, Read, Update, Delete) with search/filter
- Secure **username/password login** (single default account)
- **Forgot Password** functionality (professional reset flow)
- **Cookie-based session management** using `express-session` (httpOnly + secure flags)
- Live session & cookie demo page (`/session`)
- Public **RESTful API** endpoints (no authentication required)
- Responsive UI with **EJS + Bootstrap 5 + Bootstrap Icons**
- Deployed on **Render.com** with **MongoDB Atlas** cloud database

### 3. Project File Structure & Description

| File/Folder            | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `server.js`            | Main server: Express setup, MongoDB connection, session, all routes & logic |
| `package.json`         | Dependencies: `express`, `ejs`, `mongoose`, `express-session`, `bcryptjs`, `method-override` |
| `models/User.js`       | User schema (only one default admin account)                                |
| `models/Student.js`    | Student schema (name, studentId, age, major)                                |
| `views/`               | EJS templates:<br>• `login.ejs` – Clean login with default credentials<br>• `forgot-password.ejs` & `set-new-password.ejs` – Password reset flow<br>• `session.ejs` – Live cookie/session demo<br>• `index.ejs`, `new.ejs`, `edit.ejs` – CRUD pages |

### 4. Live Cloud URL (Fully Working)
**https://s381-kvzy.onrender.com**

> Note: Render free tier may sleep after inactivity → first load takes ~30 seconds.

### 5. Operation Guide

#### A. Login (Single Default Account)
- URL: https://s381-kvzy.onrender.com/login
- **Username**: `admin`  
  **Password**: `admin123` (default, can be changed)
- Click **Login** → redirected to student list

#### B. Forgot Password (Professional Flow)
- On login page → click **"Forgot Password?"**
- Enter username `admin` → Continue
- Set a new password (minimum 5 characters)
- Success message appears → login with new password

#### C. Session & Cookie Demo (Bonus Feature)
- Visit: https://s381-kvzy.onrender.com/session
- Shows live session ID stored in encrypted browser cookie
- Proves secure cookie-based session management

#### D. CRUD Operations (After Login)
Go to: https://s381-kvzy.onrender.com/students

| Action   | How to Do It                                  |
|----------|-----------------------------------------------|
| Read     | View table + use search/filter boxes          |
| Create   | Click **"Add New Student"** → fill form → Submit |
| Update   | Click **Edit** button → modify → Submit       |
| Delete   | Click **Delete** button → confirm             |

#### E. RESTful API Endpoints – Linux Terminal Testing Commands (Public – No Login Required)

| Method | URL                     | Terminal Command |
|--------|-------------------------|------------------|
| GET    | `/api/students`         | `curl https://s381-kvzy.onrender.com/api/students` |
| GET    | `/api/students/:id`     | `curl https://s381-kvzy.onrender.com/api/students/<ID>` |
| POST   | `/api/students`         | `curl -X POST https://s381-kvzy.onrender.com/api/students -H "Content-Type: application/json" -d '{"name":"Test Student","studentId":"999","age":20,"major":"CS"}'` |
| PUT    | `/api/students/:id`     | `curl -X PUT https://s381-kvzy.onrender.com/api/students/<ID> -H "Content-Type: application/json" -d '{"age":21}'` |
| DELETE | `/api/students/:id`     | `curl -X DELETE https://s381-kvzy.onrender.com/api/students/<ID>` |

**All commands can be run directly in Linux/macOS terminal or WSL**  
No authentication needed — perfect for marking!
### 6. Technology Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: express-session (cookie-based, secure + httpOnly)
- **Password Hashing**: bcryptjs
- **Frontend**: EJS templates + Bootstrap 5 + Bootstrap Icons
- **Deployment**: Render.com (free tier)

### 7. Bonus Features (Extra Marks!)
- Secure cookie-based session storage with live demo (`/session`)
- Professional "Forgot Password" flow
- Clean, modern UI with default account clearly displayed
- Auto-creation of default admin account on first start

**Project is fully functional, secure, responsive, and production-ready.**  
Ready for submission — thank you!

---
**Group 4 – November 2025**
