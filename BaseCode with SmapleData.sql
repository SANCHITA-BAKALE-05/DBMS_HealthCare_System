-- ============================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- COMPLETE MYSQL DATABASE + 13 TABLES
-- ============================================================

-- ============================================================
-- 1. CREATE DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS healthcare_system;

USE healthcare_system;


-- ============================================================
-- 2. USER_ACCOUNT
-- Authentication entity
-- ============================================================

CREATE TABLE User_Account (
    user_id VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,

    account_status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')
        NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL
);


-- ============================================================
-- 3. DEPARTMENT
-- ============================================================

CREATE TABLE Department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,

    department_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. PATIENT
-- ============================================================

CREATE TABLE Patient (
    patient_id VARCHAR(10) PRIMARY KEY,

    user_id VARCHAR(10) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    date_of_birth DATE NOT NULL,

    gender VARCHAR(20) NOT NULL,

    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,

    address VARCHAR(255),

    blood_group VARCHAR(5),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES User_Account(user_id)
);


-- ============================================================
-- 5. DOCTOR
-- ============================================================

CREATE TABLE Doctor (
    doctor_id VARCHAR(10) PRIMARY KEY,

    user_id VARCHAR(10) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    specialization VARCHAR(100) NOT NULL,

    department_id INT NOT NULL,

    qualification VARCHAR(150),

    experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,

    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_doctor_experience
        CHECK (experience_years >= 0),

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES User_Account(user_id),

    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id)
);


-- ============================================================
-- 6. DOCTOR_AVAILABILITY
-- ============================================================

CREATE TABLE Doctor_Availability (
    availability_id VARCHAR(10) PRIMARY KEY,

    doctor_id VARCHAR(10) NOT NULL,

    available_date DATE NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status ENUM('AVAILABLE', 'BOOKED', 'BLOCKED')
        NOT NULL DEFAULT 'AVAILABLE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_availability_time
        CHECK (end_time > start_time),

    CONSTRAINT uq_doctor_slot
        UNIQUE (
            doctor_id,
            available_date,
            start_time,
            end_time
        ),

    CONSTRAINT fk_availability_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES Doctor(doctor_id)
);


-- ============================================================
-- 7. APPOINTMENT
-- ============================================================

CREATE TABLE Appointment (
    appointment_id VARCHAR(10) PRIMARY KEY,

    patient_id VARCHAR(10) NOT NULL,

    availability_id VARCHAR(10) NOT NULL UNIQUE,

    reason VARCHAR(255),

    status ENUM(
        'PENDING',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id),

    CONSTRAINT fk_appointment_availability
        FOREIGN KEY (availability_id)
        REFERENCES Doctor_Availability(availability_id)
);


-- ============================================================
-- 8. MEDICAL_RECORD
-- ============================================================

CREATE TABLE Medical_Record (
    record_id VARCHAR(10) PRIMARY KEY,

    patient_id VARCHAR(10) NOT NULL,

    appointment_id VARCHAR(10) NOT NULL UNIQUE,

    symptoms TEXT,

    diagnosis TEXT,

    blood_pressure VARCHAR(20),

    blood_sugar DECIMAL(6,2),

    heart_rate INT,

    weight DECIMAL(5,2),

    doctor_notes TEXT,

    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_medical_heart_rate
        CHECK (heart_rate IS NULL OR heart_rate > 0),

    CONSTRAINT chk_medical_blood_sugar
        CHECK (blood_sugar IS NULL OR blood_sugar >= 0),

    CONSTRAINT chk_medical_weight
        CHECK (weight IS NULL OR weight > 0),

    CONSTRAINT fk_record_patient
        FOREIGN KEY (patient_id)
        REFERENCES Patient(patient_id),

    CONSTRAINT fk_record_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES Appointment(appointment_id)
);


-- ============================================================
-- 9. PRESCRIPTION
-- ============================================================

CREATE TABLE Prescription (
    prescription_id VARCHAR(10) PRIMARY KEY,

    record_id VARCHAR(10) NOT NULL UNIQUE,

    prescription_date DATE NOT NULL,

    instructions TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_record
        FOREIGN KEY (record_id)
        REFERENCES Medical_Record(record_id)
);


-- ============================================================
-- 10. PRESCRIPTION_ITEM
-- ============================================================

CREATE TABLE Prescription_Item (
    prescription_item_id VARCHAR(10) PRIMARY KEY,

    prescription_id VARCHAR(10) NOT NULL,

    medicine_name VARCHAR(100) NOT NULL,

    dosage VARCHAR(50),

    frequency VARCHAR(100),

    duration VARCHAR(50),

    instructions VARCHAR(255),

    CONSTRAINT fk_prescription_item_prescription
        FOREIGN KEY (prescription_id)
        REFERENCES Prescription(prescription_id)
);


-- ============================================================
-- 11. PAYMENT
-- ============================================================

CREATE TABLE Payment (
    payment_id VARCHAR(10) PRIMARY KEY,

    appointment_id VARCHAR(10) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM(
        'CASH',
        'CARD',
        'UPI',
        'ONLINE'
    ) NOT NULL,

    payment_status ENUM(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING',

    transaction_reference VARCHAR(100) UNIQUE,

    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT fk_payment_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES Appointment(appointment_id)
);


-- ============================================================
-- 12. FEEDBACK
-- ============================================================

CREATE TABLE Feedback (
    feedback_id VARCHAR(10) PRIMARY KEY,

    appointment_id VARCHAR(10) NOT NULL UNIQUE,

    rating INT NOT NULL,

    comments TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_feedback_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES Appointment(appointment_id)
);


-- ============================================================
-- 13. APPOINTMENT_AUDIT
-- ============================================================

CREATE TABLE Appointment_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,

    appointment_id VARCHAR(10) NOT NULL,

    old_status VARCHAR(20),

    new_status VARCHAR(20),

    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    changed_by VARCHAR(100),

    remarks VARCHAR(255),

    CONSTRAINT fk_audit_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES Appointment(appointment_id)
);


-- ============================================================
-- 14. ADMIN
-- ============================================================

CREATE TABLE Admin (
    admin_id VARCHAR(10) PRIMARY KEY,

    user_id VARCHAR(10) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    phone VARCHAR(15) NOT NULL UNIQUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES User_Account(user_id)
);


-- ============================================================
-- 15. VERIFY THAT ALL 13 TABLES WERE CREATED
-- ============================================================

SHOW TABLES;

-- ============================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- SAMPLE DATA FOR ALL 13 TABLES
-- ============================================================

USE healthcare_system;


-- ============================================================
-- 1. USER_ACCOUNT
-- ============================================================

INSERT INTO User_Account
(user_id, username, password_hash, role, account_status, last_login)
VALUES
('U001', 'rahul_p', 'hashed_password_001', 'PATIENT', 'ACTIVE', '2026-09-15 09:30:00'),
('U002', 'priya_s', 'hashed_password_002', 'PATIENT', 'ACTIVE', '2026-09-16 10:15:00'),
('U003', 'amit_k', 'hashed_password_003', 'PATIENT', 'ACTIVE', '2026-09-14 18:20:00'),
('U004', 'neha_j', 'hashed_password_004', 'PATIENT', 'ACTIVE', '2026-09-17 08:45:00'),
('U005', 'rohan_m', 'hashed_password_005', 'PATIENT', 'ACTIVE', '2026-09-13 11:10:00'),

('U006', 'dr_sharma', 'hashed_password_006', 'DOCTOR', 'ACTIVE', '2026-09-17 09:00:00'),
('U007', 'dr_patil', 'hashed_password_007', 'DOCTOR', 'ACTIVE', '2026-09-16 14:30:00'),
('U008', 'dr_mehta', 'hashed_password_008', 'DOCTOR', 'ACTIVE', '2026-09-15 12:00:00'),
('U009', 'admin01', 'hashed_password_009', 'ADMIN', 'ACTIVE', '2026-09-17 08:00:00');


-- ============================================================
-- 2. DEPARTMENT
-- ============================================================

INSERT INTO Department
(department_name, description)
VALUES
('Cardiology', 'Diagnosis and treatment of heart-related conditions'),
('General Medicine', 'General medical consultation and treatment'),
('Dermatology', 'Diagnosis and treatment of skin-related conditions'),
('Neurology', 'Diagnosis and treatment of nervous system disorders'),
('Orthopedics', 'Treatment of bones, joints and muscles');


-- ============================================================
-- 3. PATIENT
-- ============================================================

INSERT INTO Patient
(patient_id, user_id, first_name, last_name, date_of_birth,
 gender, phone, email, address, blood_group)
VALUES
('P001', 'U001', 'Rahul', 'Patil', '2002-05-14',
 'Male', '9876543210', 'rahul.patil@email.com',
 'Amravati, Maharashtra', 'B+'),

('P002', 'U002', 'Priya', 'Sharma', '2000-08-21',
 'Female', '9876543211', 'priya.sharma@email.com',
 'Nagpur, Maharashtra', 'A+'),

('P003', 'U003', 'Amit', 'Kulkarni', '1998-11-03',
 'Male', '9876543212', 'amit.kulkarni@email.com',
 'Pune, Maharashtra', 'O+'),

('P004', 'U004', 'Neha', 'Joshi', '2003-02-17',
 'Female', '9876543213', 'neha.joshi@email.com',
 'Akola, Maharashtra', 'AB+'),

('P005', 'U005', 'Rohan', 'More', '1995-07-29',
 'Male', '9876543214', 'rohan.more@email.com',
 'Wardha, Maharashtra', 'O-');


-- ============================================================
-- 4. DOCTOR
-- ============================================================

INSERT INTO Doctor
(doctor_id, user_id, first_name, last_name, specialization,
 department_id, qualification, experience_years, phone, email)
VALUES
('D001', 'U006', 'Rajesh', 'Sharma', 'Cardiologist',
 1, 'MD Cardiology', 12.5, '9876500010', 'dr.rajesh@email.com'),

('D002', 'U007', 'Sneha', 'Patil', 'General Physician',
 2, 'MBBS, MD Medicine', 8.0, '9876500011', 'dr.sneha@email.com'),

('D003', 'U008', 'Anil', 'Mehta', 'Dermatologist',
 3, 'MBBS, MD Dermatology', 10.5, '9876500012', 'dr.anil@email.com');


-- ============================================================
-- 5. DOCTOR_AVAILABILITY
-- ============================================================

INSERT INTO Doctor_Availability
(availability_id, doctor_id, available_date, start_time, end_time, status)
VALUES

('A001', 'D001', '2026-09-18', '09:00:00', '09:30:00', 'BOOKED'),
('A002', 'D001', '2026-09-18', '10:00:00', '10:30:00', 'BOOKED'),
('A003', 'D001', '2026-09-18', '11:00:00', '11:30:00', 'AVAILABLE'),
('A004', 'D001', '2026-09-19', '09:00:00', '09:30:00', 'AVAILABLE'),

('A005', 'D002', '2026-09-18', '10:00:00', '10:30:00', 'BOOKED'),
('A006', 'D002', '2026-09-18', '11:00:00', '11:30:00', 'BOOKED'),
('A007', 'D002', '2026-09-19', '10:00:00', '10:30:00', 'AVAILABLE'),
('A008', 'D002', '2026-09-19', '11:00:00', '11:30:00', 'AVAILABLE'),

('A009', 'D003', '2026-09-18', '14:00:00', '14:30:00', 'BOOKED'),
('A010', 'D003', '2026-09-18', '15:00:00', '15:30:00', 'BOOKED'),
('A011', 'D003', '2026-09-19', '14:00:00', '14:30:00', 'AVAILABLE'),
('A012', 'D003', '2026-09-19', '15:00:00', '15:30:00', 'AVAILABLE');


-- ============================================================
-- 6. APPOINTMENT
-- ============================================================

INSERT INTO Appointment
(appointment_id, patient_id, availability_id, reason, status)
VALUES

('AP001', 'P001', 'A001',
 'Chest discomfort and fatigue', 'COMPLETED'),

('AP002', 'P002', 'A002',
 'Routine heart checkup', 'COMPLETED'),

('AP003', 'P003', 'A005',
 'Fever and weakness', 'COMPLETED'),

('AP004', 'P004', 'A006',
 'Headache and dizziness', 'CONFIRMED'),

('AP005', 'P005', 'A009',
 'Skin irritation and itching', 'COMPLETED'),

('AP006', 'P001', 'A010',
 'Skin allergy', 'CONFIRMED');


-- ============================================================
-- 7. MEDICAL_RECORD
-- ============================================================

INSERT INTO Medical_Record
(record_id, patient_id, appointment_id, symptoms, diagnosis,
 blood_pressure, blood_sugar, heart_rate, weight, doctor_notes)
VALUES

('R001', 'P001', 'AP001',
 'Chest discomfort, fatigue',
 'Mild hypertension',
 '145/92', 118.50, 86, 72.50,
 'Monitor blood pressure regularly and reduce salt intake.'),

('R002', 'P002', 'AP002',
 'Occasional tiredness',
 'Normal cardiac condition',
 '122/80', 95.00, 74, 60.20,
 'Continue regular exercise and balanced diet.'),

('R003', 'P003', 'AP003',
 'Fever, weakness and body pain',
 'Viral fever',
 '128/82', 102.00, 88, 68.40,
 'Take adequate rest and maintain hydration.'),

('R004', 'P005', 'AP005',
 'Skin irritation and itching',
 'Allergic dermatitis',
 '130/85', 110.00, 80, 75.00,
 'Avoid suspected allergens and follow prescribed medication.'),

('R005', 'P004', 'AP004',
 'Headache and dizziness',
 'Migraine',
 '125/82', 98.00, 78, 58.50,
 'Maintain sleep schedule and avoid known migraine triggers.');


-- ============================================================
-- 8. PRESCRIPTION
-- ============================================================

INSERT INTO Prescription
(prescription_id, record_id, prescription_date, instructions)
VALUES

('PR001', 'R001', '2026-09-18',
 'Take medicines after meals and monitor BP.'),

('PR002', 'R003', '2026-09-18',
 'Take medicines as prescribed and drink plenty of fluids.'),

('PR003', 'R004', '2026-09-18',
 'Apply medication to affected area and avoid allergens.'),

('PR004', 'R005', '2026-09-18',
 'Take medicine when symptoms occur and rest properly.');


-- ============================================================
-- 9. PRESCRIPTION_ITEM
-- ============================================================

INSERT INTO Prescription_Item
(prescription_item_id, prescription_id, medicine_name,
 dosage, frequency, duration, instructions)
VALUES

('PI001', 'PR001', 'Amlodipine',
 '5 mg', 'Once daily', '30 days',
 'Take after breakfast.'),

('PI002', 'PR001', 'Paracetamol',
 '500 mg', 'Twice daily', '5 days',
 'Take after meals if required.'),

('PI003', 'PR002', 'Paracetamol',
 '500 mg', 'Three times daily', '3 days',
 'Take after meals.'),

('PI004', 'PR002', 'ORS',
 '1 sachet', 'Twice daily', '3 days',
 'Dissolve in clean water.'),

('PI005', 'PR003', 'Cetirizine',
 '10 mg', 'Once daily', '7 days',
 'Take at night.'),

('PI006', 'PR003', 'Hydrocortisone Cream',
 'Apply thin layer', 'Twice daily', '5 days',
 'Apply only on affected area.'),

('PI007', 'PR004', 'Sumatriptan',
 '50 mg', 'As required', '10 days',
 'Take during migraine attack.');


-- ============================================================
-- 10. PAYMENT
-- ============================================================

INSERT INTO Payment
(payment_id, appointment_id, amount, payment_method,
 payment_status, transaction_reference)
VALUES

('PAY001', 'AP001', 800.00, 'UPI', 'PAID', 'TXN1001'),

('PAY002', 'AP002', 800.00, 'CARD', 'PAID', 'TXN1002'),

('PAY003', 'AP003', 500.00, 'CASH', 'PAID', 'TXN1003'),

('PAY004', 'AP004', 500.00, 'UPI', 'PAID', 'TXN1004'),

('PAY005', 'AP005', 700.00, 'ONLINE', 'PAID', 'TXN1005'),

('PAY006', 'AP006', 700.00, 'UPI', 'PENDING', 'TXN1006');


-- ============================================================
-- 11. FEEDBACK
-- ============================================================

INSERT INTO Feedback
(feedback_id, appointment_id, rating, comments)
VALUES

('F001', 'AP001', 5,
 'Doctor explained the problem clearly.'),

('F002', 'AP002', 4,
 'Good consultation experience.'),

('F003', 'AP003', 5,
 'Doctor was very helpful and attentive.'),

('F004', 'AP005', 4,
 'Treatment was explained properly.');


-- ============================================================
-- 12. APPOINTMENT_AUDIT
-- ============================================================

INSERT INTO Appointment_Audit
(appointment_id, old_status, new_status, changed_by, remarks)
VALUES

('AP001', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed by admin.'),

('AP001', 'CONFIRMED', 'COMPLETED',
 'dr_sharma', 'Consultation completed.'),

('AP002', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed.'),

('AP002', 'CONFIRMED', 'COMPLETED',
 'dr_sharma', 'Routine checkup completed.'),

('AP003', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed.'),

('AP003', 'CONFIRMED', 'COMPLETED',
 'dr_sneha', 'Patient consultation completed.'),

('AP004', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed.'),

('AP005', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed.'),

('AP005', 'CONFIRMED', 'COMPLETED',
 'dr_anil', 'Dermatology consultation completed.'),

('AP006', 'PENDING', 'CONFIRMED',
 'admin01', 'Appointment confirmed.');


-- ============================================================
-- 13. ADMIN
-- ============================================================

INSERT INTO Admin
(admin_id, user_id, first_name, last_name, email, phone)
VALUES

('AD001', 'U009', 'Admin', 'User',
 'admin@healthcare.com', '9876599999');


-- ============================================================
-- SAMPLE DATA INSERTION COMPLETE
-- ============================================================


-- ============================================================
-- VERIFY ROW COUNTS
-- ============================================================

SELECT 'User_Account' AS Table_Name, COUNT(*) AS Row_Count
FROM User_Account

UNION ALL

SELECT 'Department', COUNT(*)
FROM Department

UNION ALL

SELECT 'Patient', COUNT(*)
FROM Patient

UNION ALL

SELECT 'Doctor', COUNT(*)
FROM Doctor

UNION ALL

SELECT 'Doctor_Availability', COUNT(*)
FROM Doctor_Availability

UNION ALL

SELECT 'Appointment', COUNT(*)
FROM Appointment

UNION ALL

SELECT 'Medical_Record', COUNT(*)
FROM Medical_Record

UNION ALL

SELECT 'Prescription', COUNT(*)
FROM Prescription

UNION ALL

SELECT 'Prescription_Item', COUNT(*)
FROM Prescription_Item

UNION ALL

SELECT 'Payment', COUNT(*)
FROM Payment

UNION ALL

SELECT 'Feedback', COUNT(*)
FROM Feedback

UNION ALL

SELECT 'Appointment_Audit', COUNT(*)
FROM Appointment_Audit

UNION ALL

SELECT 'Admin', COUNT(*)
FROM Admin;