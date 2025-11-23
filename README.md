# Student Manager – COMPS381F Final Project (Group 4)

### 1. Project Information
- **Project Name**: Student Manager (Full-Stack Secure CRUD Application)
- **Course**: COMPS381F – Web Programming & Security
- **Group Number**: Group 4
- **Members**:
  - Wong Yan Ho (SID 13679156)
  - Kwan Wai Lam (SID 13701745)
  - Wu Yu Hei (SID 13024164)
  - Li Lok Yiu (SID 13512448)
  - Ning Rui Qi (SID 13053319)

### 2. Key Features (All Working)
- Full **CRUD** with **search & filter** (by Name, Major, Age range, **Gender**)
- Secure **login system** with bcrypt-hashed password
- **Forgot Password** flow (professional 3-step reset)
- **Gender field** (Male/Female) in both Create & Edit forms
- Clean, responsive UI using **Bootstrap 5 + EJS**
- Cookie consent banner (GDPR-style)
- Public **RESTful API** (no auth required – perfect for testing)
- Auto-creates default admin on first run
- Deployed on **Render.com** + **MongoDB Atlas**

### 3. Live Demo (Always Online)
**https://s381-kvzy.onrender.com**

> Note: Render free tier sleeps after inactivity → first visit may take 15–30 seconds

### 4. Default Login Credentials
| Username | Password  |
|----------|-----------|
| `admin`  | `admin123` |

You can change the password anytime via **Forgot Password**

### 5. CRUD Operations Guide
After login → go to: https://s381-kvzy.onrender.com/students

| Action     | How to Do                                      |
|------------|-------------------------------------------------|
| View       | Table with search by Name / Major / Age / Gender |
| Add        | Click **"Add New Student"** → fill all fields   |
| Edit       | Click **Edit** → modify → **Update Student**    |
| Delete     | Click **Delete** → confirm                      |
| Reset All | Click **"All Students"** button to clear search |

### 6. RESTful API – Test in Any Terminal (Linux/macOS/Windows WSL/PowerShell)


# READ
curl https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a

# UPDATE age
curl -X PUT https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a \
  -H "Content-Type: application/json" \
  -d '{"age": 22}'

# UPDATE major
curl -X PUT https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a \
  -H "Content-Type: application/json" \
  -d '{"major": "Computer Science"}'

# DELETE
curl -X DELETE https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a

# CREATE new
curl -X POST https://s381-kvzy.onrender.com/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"WONG Siu Ming","studentId":"22012345","age":19,"gender":"Female","major":"Nursing"}'



  1. READ – Get this student (WORKS EVERYWHERE)
cmdcurl https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a
2. UPDATE – Change age to 22 (Windows CMD – ONE LINE)
cmdcurl -X PUT https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a -H "Content-Type: application/json" -d "{\"age\": 22}"
3. UPDATE – Change major to Computer Science (Windows CMD – ONE LINE)
cmdcurl -X PUT https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a -H "Content-Type: application/json" -d "{\"major\": \"Computer Science\"}"
4. UPDATE – Full update (name + major) (Windows CMD – ONE LINE)
cmdcurl -X PUT https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a -H "Content-Type: application/json" -d "{\"name\": \"NGAI Tin Yan\", \"major\": \"Information Technology\"}"
5. DELETE – Remove this student (Windows CMD – ONE LINE)
cmdcurl -X DELETE https://s381-kvzy.onrender.com/api/students/69208fcde2557fab21ce4d6a
6. CREATE – Add a new student (Windows CMD – ONE LINE)
cmdcurl -X POST https://s381-kvzy.onrender.com/api/students -H "Content-Type: application/json" -d "{\"name
