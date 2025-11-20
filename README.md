# Student Manager
COMPS381F Group 4 Project

### 1. Project Information
- Project Name: Student Manager (Full-Stack CRUD + Authentication + Facebook OAuth)
- Group Number: Group 4
- Student Name: Wong Yan Ho ,Kwan Wai Lam ,Wu Yu Hei ,Li Lok Yiu ,Ning Rui Qi 
- Student ID (SID): 1367915,13701745,13024164,13512448,13053319

2. Project Features
- Full CRUD operations for student records (Create, Read, Update, Delete)
- Secure username/password login + one-click Facebook Login
- Session-based authentication (protected routes)
- RESTful API endpoints (public access)
- Responsive web interface using EJS + Bootstrap 5
- Deployed on Render.com with MongoDB Atlas cloud database

3. Project File Structure & Description

| File/Folder        | Description |
|--------------------|-----------|
| `server.js`        | Main server file. Contains Express setup, MongoDB connection, session management, all routes (web + API), Facebook OAuth using Passport.js |
| `package.json`     | Project dependencies: `express`, `mongoose`, `ejs`, `express-session`, `bcryptjs`, `passport`, `passport-facebook`, `method-override`, etc. |
| `models/User.js`   | Mongoose schema for users (supports both local accounts and Facebook login) |
| `models/Student.js`| Mongoose schema for student records (name, studentId, age, major) |
| `views/`           | EJS templates:<br>• `login.ejs` – Login page with Facebook button<br>• `signup.ejs` – Registration page<br>• `index.ejs` – Student list with search & CRUD buttons<br>• `new.ejs`, `edit.ejs` – Add/Edit forms |
| `config/passport.js` | Passport.js configuration for Facebook OAuth strategy |

4. Live Cloud URL (Deployed & Working)
   
https://s381-kvzy.onrender.com


### 5. Operation Guide

#### A. Login Options

Method 1: Username & Password
- Go to: https://s381-kvzy.onrender.com/login
- Example account (you can create your own too):
  - Username: `admin`
  - Password: `123456`
- Or click **"Sign up here"** to create a new account

Method 2: One-Click Facebook Login (NOT DONE YET)
- Click the blue "Continue with Facebook" button
- You will see a warning (normal for shared test app)
- Enter any fake email & password → Click "登入"
- Click "繼續" → Instantly logged in!

#### B. Web CRUD Operations (After Login)

Go to: https://s381-kvzy.onrender.com/students

| Action   | How to Do It |
|----------|--------------|
| **Read**   | View the student table. Use search boxes (Name / Major / Age range) |
| **Create** | Click **"Add New Student"** → Fill form → Submit |
| **Update** | Click **"Edit"** button on a row → Modify → Submit |
| **Delete** | Click **"Delete"** button on a row → Confirm |

#### C. RESTful API Endpoints (Public – No Login Required)

| Method | URL | Description | Example cURL |
|--------|-----|-----------|--------------|
| GET    | `/api/students` | List all students | `curl https://s381-kvzy.onrender.com/api/students` |
| GET    | `/api/students/:id` | Get one student | `curl https://s381-kvzy.onrender.com/api/students/67f1...` |
| POST   | `/api/students` | Create new student | `curl -X POST -H "Content-Type: application/json" -d '{"name":"Test","studentId":"999","age":20,"major":"CS"}' https://s381-kvzy.onrender.com/api/students` |
| PUT    | `/api/students/:id` | Update student | (replace ID and data) |
| DELETE | `/api/students/:id` | Delete student | (replace ID) |

### 6. Technology Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: express-session + Passport.js + Facebook OAuth
- **Frontend**: EJS templates + Bootstrap 5 + Bootstrap Icons
- **Deployment**: Render.com (free tier)

### 7. Notes
- Facebook Login uses the official class-shared test app (App ID: 836608155559961) → the warning screen is expected and normal
- All personal data is safely handled; email is only stored if user allows it
- Project is fully functional, responsive, and production-ready
