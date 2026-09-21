-- ============================================================
-- BASIC SQL QUERY TESTING
-- Healthcare Appointment & Patient Analytics System
-- ============================================================

USE healthcare_system;


-- ============================================================
-- QUERY 1: SELECT
-- Display all patients
-- ============================================================

SELECT *
FROM Patient;


-- ============================================================
-- QUERY 2: WHERE
-- Display female patients
-- ============================================================

SELECT patient_id, first_name, last_name, gender
FROM Patient
WHERE gender = 'Female';


-- ============================================================
-- QUERY 3: ORDER BY
-- Display doctors from highest to lowest experience
-- ============================================================

SELECT doctor_id, first_name, last_name,
       specialization, experience_years
FROM Doctor
ORDER BY experience_years DESC;


-- ============================================================
-- QUERY 4: WHERE + SELECT
-- Display completed appointments
-- ============================================================

SELECT appointment_id, patient_id, status, reason
FROM Appointment
WHERE status = 'COMPLETED';


-- ============================================================
-- QUERY 5: COUNT
-- Count total number of patients
-- ============================================================

SELECT COUNT(*) AS total_patients
FROM Patient;

-- ============================================================
-- JOIN QUERY TESTING
-- Healthcare Appointment & Patient Analytics System
-- ============================================================

USE healthcare_system;


-- ============================================================
-- QUERY 1: Patient + Appointment
-- Basic INNER JOIN
-- ============================================================

SELECT
    p.patient_id,
    p.first_name,
    p.last_name,
    a.appointment_id,
    a.reason,
    a.status
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id;


-- ============================================================
-- QUERY 2: Patient + Appointment + Doctor
-- Joining through Doctor_Availability
-- ============================================================

SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    a.appointment_id,
    a.reason,
    a.status,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id
JOIN Doctor_Availability da
    ON a.availability_id = da.availability_id
JOIN Doctor d
    ON da.doctor_id = d.doctor_id;


-- ============================================================
-- QUERY 3: Patient + Appointment + Doctor + Department
-- Joining 5 related tables
-- ============================================================

SELECT
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    dep.department_name,
    a.status
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id
JOIN Doctor_Availability da
    ON a.availability_id = da.availability_id
JOIN Doctor d
    ON da.doctor_id = d.doctor_id
JOIN Department dep
    ON d.department_id = dep.department_id;
    
    
-- ============================================================
-- JOIN + WHERE + ORDER BY + GROUP BY
-- Healthcare Appointment & Patient Analytics System
-- ============================================================

USE healthcare_system;


-- ============================================================
-- QUERY 4: JOIN + WHERE
-- Show completed appointments with patient and doctor
-- ============================================================

SELECT
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    a.status
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id
JOIN Doctor_Availability da
    ON a.availability_id = da.availability_id
JOIN Doctor d
    ON da.doctor_id = d.doctor_id
WHERE a.status = 'COMPLETED';


-- ============================================================
-- QUERY 5: JOIN + ORDER BY
-- Show appointments ordered by doctor experience
-- ============================================================

SELECT
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    d.experience_years,
    a.status
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id
JOIN Doctor_Availability da
    ON a.availability_id = da.availability_id
JOIN Doctor d
    ON da.doctor_id = d.doctor_id
ORDER BY d.experience_years DESC;


-- ============================================================
-- QUERY 6: JOIN + GROUP BY
-- Count appointments handled by each doctor
-- ============================================================

SELECT
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    COUNT(a.appointment_id) AS total_appointments
FROM Doctor d
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
GROUP BY
    d.doctor_id,
    d.first_name,
    d.last_name,
    d.specialization;


-- ============================================================
-- QUERY 7: JOIN + WHERE + GROUP BY
-- Count completed appointments for each doctor
-- ============================================================

SELECT
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    COUNT(a.appointment_id) AS completed_appointments
FROM Doctor d
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
WHERE a.status = 'COMPLETED'
GROUP BY
    d.doctor_id,
    d.first_name,
    d.last_name;
    
    
-- =====================================================
-- QUERY 8: COUNT()
-- Total appointments handled by each doctor
-- =====================================================

SELECT
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    COUNT(a.appointment_id) AS total_appointments
FROM Doctor d
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
GROUP BY
    d.doctor_id,
    d.first_name,
    d.last_name;


-- =====================================================
-- QUERY 9: SUM()
-- Total amount collected from payments
-- =====================================================

SELECT
    SUM(amount) AS total_payment_amount
FROM Payment
WHERE payment_status = 'PAID';


-- =====================================================
-- QUERY 10: AVG()
-- Average experience of doctors
-- =====================================================

SELECT
    AVG(experience_years) AS average_doctor_experience
FROM Doctor;


-- =====================================================
-- QUERY 11: MAX() and MIN()
-- Highest and lowest doctor experience
-- =====================================================

SELECT
    MAX(experience_years) AS highest_experience,
    MIN(experience_years) AS lowest_experience
FROM Doctor;


-- =====================================================
-- QUERY 12: HAVING
-- Doctors who have handled more than 1 appointment
-- =====================================================

SELECT
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    COUNT(a.appointment_id) AS total_appointments
FROM Doctor d
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
GROUP BY
    d.doctor_id,
    d.first_name,
    d.last_name
HAVING COUNT(a.appointment_id) > 1;


-- =====================================================
-- QUERY 13: SUBQUERY
-- Patients who have at least one completed appointment
-- =====================================================

SELECT
    patient_id,
    first_name,
    last_name
FROM Patient
WHERE patient_id IN (
    SELECT patient_id
    FROM Appointment
    WHERE status = 'COMPLETED'
);


-- =====================================================
-- QUERY 14: SUBQUERY + AVG()
-- Doctors whose experience is above the average
-- =====================================================

SELECT
    doctor_id,
    CONCAT(first_name, ' ', last_name) AS doctor_name,
    experience_years
FROM Doctor
WHERE experience_years > (
    SELECT AVG(experience_years)
    FROM Doctor
);


-- =====================================================
-- QUERY 15: GROUP BY + AVG()
-- Average payment amount by payment method
-- =====================================================

SELECT
    payment_method,
    AVG(amount) AS average_payment
FROM Payment
GROUP BY payment_method;