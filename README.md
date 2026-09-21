<<<<<<< HEAD
# Healthcare Appointment & Patient Analytics System

A full-stack B.Tech AI & DS college project demonstrating a complete healthcare management system with a MySQL database, Node.js/Express backend, React frontend, and Python ML prediction service.

---

## Architecture

```
React Frontend (Vite)
        │
        │  HTTP / REST API
        ▼
Node.js + Express Backend
    /           \
   /             \
  ▼               ▼
MySQL DB     Python ML API
                  │
                  ▼
           Existing .pkl Models
```

---

## Technology Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React.js (Vite)         |
| Backend    | Node.js + Express.js    |
| Database   | MySQL 8                 |
| DB Driver  | mysql2                  |
| Auth       | JWT + bcrypt            |
| ML Service | Python + Flask          |
| ML Models  | scikit-learn (.pkl)     |
| Charts     | Recharts                |

---

## Project Structure

```
project-root/
│
├── BaseCode with SmapleData.sql   ← DB schema + sample data
├── 02_Basic_SQL_Queries.sql       ← Basic SQL queries
├── 03_Advanced_SQL.sql            ← Views, procedures, trigger, transaction
├── 04_Analytics.sql               ← 20 analytics queries
│
├── 05_Diabetes_Model.py           ← ML training pipeline
├── 06_ML_Hypertension.py
├── 07_ML_Cardiovascular.py
├── 08_ML_Obesity.py
│
├── *.pkl                          ← Trained ML model artifacts
│
├── backend/                       ← Node.js Express API
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/db.js
│       ├── middleware/authMiddleware.js
│       ├── routes/
│       ├── controllers/
│       └── utils/
│
├── frontend/                      ← React application
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── services/api.js
│       ├── components/
│       └── pages/
│
└── ml_service/                    ← Python Flask ML API
    ├── app.py
    └── requirements.txt
```

---

## Setup Instructions

### 1. MySQL Database

1. Start MySQL server
2. Open MySQL Workbench or CLI
3. Run `BaseCode with SmapleData.sql` to create tables and insert sample data
4. Run `03_Advanced_SQL.sql` to create views, procedures, functions, and triggers

### 2. Backend

```bash
cd backend
npm install

# Create your .env file
cp .env.example .env
# Edit .env and set DB_PASSWORD and other values

# Seed real bcrypt passwords for sample accounts
node src/utils/seed_passwords.js

# Start backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Python ML Service

```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

ML service runs on: `http://localhost:5001`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Test Credentials (after running seed_passwords.js)

| Role    | Username   | Password     |
|---------|------------|--------------|
| Patient | rahul_p    | password123  |
| Patient | priya_s    | password123  |
| Doctor  | dr_sharma  | doctor123    |
| Doctor  | dr_patil   | doctor123    |
| Admin   | admin01    | admin123     |

---

## API Endpoints

### Auth
| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| POST   | /api/auth/register| Patient registration|
| POST   | /api/auth/login   | Login (all roles)  |
| GET    | /api/auth/me      | Current user info  |

### Health
| Method | Endpoint       | Description         |
|--------|----------------|---------------------|
| GET    | /api/health    | Server + DB status  |

### Patient
| Method | Endpoint                    | Access   |
|--------|-----------------------------|----------|
| GET    | /api/patients/profile       | PATIENT  |
| PUT    | /api/patients/profile       | PATIENT  |

### Doctors
| Method | Endpoint                         | Access     |
|--------|----------------------------------|------------|
| GET    | /api/doctors                     | Public     |
| GET    | /api/doctors/:id                 | Public     |
| GET    | /api/doctors/:id/availability    | Public     |
| GET    | /api/doctors/profile             | DOCTOR     |
| GET    | /api/doctors/my-availability     | DOCTOR     |
| POST   | /api/doctors/my-availability     | DOCTOR     |
| DELETE | /api/doctors/my-availability/:id | DOCTOR     |

### Appointments
| Method | Endpoint                       | Access        |
|--------|--------------------------------|---------------|
| POST   | /api/appointments              | PATIENT       |
| GET    | /api/appointments              | PATIENT       |
| GET    | /api/appointments/doctor       | DOCTOR        |
| GET    | /api/appointments/:id          | AUTH          |
| PUT    | /api/appointments/:id/cancel   | PATIENT       |
| PUT    | /api/appointments/:id/status   | DOCTOR/ADMIN  |

### Medical Records
| Method | Endpoint                            | Access       |
|--------|-------------------------------------|--------------|
| GET    | /api/medical-records                | PATIENT      |
| GET    | /api/medical-records/patient/:id    | DOCTOR/ADMIN |
| POST   | /api/medical-records                | DOCTOR       |

### Other
- `GET/POST /api/prescriptions`
- `GET /api/payments`
- `GET/POST /api/feedback`

### Admin
- `GET /api/admin/patients`
- `GET /api/admin/doctors` + `POST`
- `GET /api/admin/appointments`
- `GET /api/admin/payments`
- `GET /api/admin/feedback`
- `GET /api/admin/audit`

### Analytics
- `GET /api/analytics/summary`
- `GET /api/analytics/appointments`
- `GET /api/analytics/departments`
- `GET /api/analytics/doctors`
- `GET /api/analytics/revenue`
- `GET /api/analytics/patients`
- `GET /api/analytics/health-metrics`

### ML Predictions
| Method | Endpoint                  | Features Required                          |
|--------|---------------------------|--------------------------------------------|
| POST   | /api/ml/diabetes          | Age, Sex, BMI, HighBP                      |
| POST   | /api/ml/hypertension      | 12 features (see MLPrediction.jsx)         |
| POST   | /api/ml/cardiovascular    | 13 clinical features (Cleveland dataset)   |
| POST   | /api/ml/obesity           | 16 lifestyle + physical features           |

---

## Database Schema Summary

13 Tables: `User_Account`, `Patient`, `Doctor`, `Department`, `Doctor_Availability`,
`Appointment`, `Medical_Record`, `Prescription`, `Prescription_Item`,
`Payment`, `Feedback`, `Appointment_Audit`, `Admin`

Key DB objects:
- **View:** `vw_appointment_details`
- **Procedure:** `GetPatientAppointments(p_id)`
- **Function:** `CalculateAge(dob)`
- **Trigger:** `trg_appointment_status_update` → auto-inserts into Appointment_Audit

---

## ML Models

| Model          | Algorithm              | Output       | Preprocessing        |
|----------------|------------------------|--------------|----------------------|
| Diabetes       | Calibrated LogReg      | Binary prob  | None (raw values)    |
| Hypertension   | Calibrated LogReg      | Binary prob  | StandardScaler       |
| Cardiovascular | Calibrated LogReg      | Binary prob  | StandardScaler       |
| Obesity        | Calibrated Pipeline    | Multi-class  | OHE + StandardScaler |

⚠️ All ML results are **model estimates only** — not medical diagnoses.

---

## Important Viva Concepts

1. **JWT Authentication** — stateless tokens, signed with secret, contain role/user_id
2. **bcrypt** — one-way password hashing with salt rounds
3. **MySQL Transactions** — ACID guarantees for appointment booking
4. **DB Trigger** — auto-audit on Appointment UPDATE (no manual backend insert needed)
5. **Connection Pool** — mysql2 pool handles concurrent DB connections efficiently
6. **Role-based Authorization** — middleware checks JWT role before allowing access
7. **Parameterized Queries** — prevent SQL injection (`?` placeholders in mysql2)
8. **React Context** — global auth state without prop drilling
9. **Vite Proxy** — in dev, /api requests are forwarded to backend automatically
10. **Calibrated ML** — `CalibratedClassifierCV` improves probability reliability
=======
# DBMS_HealthCare_System
>>>>>>> 578481b9dc3dc8595c0a0e019ee9ad49fc39cc4f
