-- ============================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- File: 02_Basic_SQL_Queries.sql
--
-- PURPOSE:
--   This file demonstrates basic SQL operations on the
--   healthcare_system database. It is used to test and
--   verify that all 13 tables are populated correctly.
--
-- The queries here cover the fundamental SQL concepts:
--   SELECT, WHERE, ORDER BY, COUNT, SUM, AVG,
--   MAX/MIN, JOIN, GROUP BY, HAVING, SUBQUERY
-- ============================================================

USE healthcare_system;


-- ============================================================
-- QUERY 1: SELECT
-- Display all patients
-- Retrieves every column and every row from the Patient table.
-- Used to verify that patient data was inserted correctly.
-- ============================================================

SELECT *
FROM Patient;


-- ============================================================
-- QUERY 2: WHERE
-- Display female patients
-- The WHERE clause filters rows — only patients where
-- gender = 'Female' are included in the result.
-- ============================================================

SELECT patient_id, first_name, last_name, gender
FROM Patient
WHERE gender = 'Female';


-- ============================================================
-- QUERY 3: ORDER BY
-- Display doctors from highest to lowest experience
-- ORDER BY ... DESC sorts in descending order
-- (most experienced doctor shown first).
-- ============================================================

SELECT doctor_id, first_name, last_name,
       specialization, experience_years
FROM Doctor
ORDER BY experience_years DESC;


-- ============================================================
-- QUERY 4: WHERE + SELECT
-- Display completed appointments
-- Filters the Appointment table to show only rows where
-- the status column equals 'COMPLETED'.
-- ============================================================

SELECT appointment_id, patient_id, status, reason
FROM Appointment
WHERE status = 'COMPLETED';


-- ============================================================
-- QUERY 5: COUNT
-- Count total number of patients
-- COUNT(*) returns the total number of rows in the table.
-- AS total_patients gives a readable name to the result column.
-- ============================================================

SELECT COUNT(*) AS total_patients
FROM Patient;

-- ============================================================
-- JOIN QUERY TESTING
-- Healthcare Appointment & Patient Analytics System
--
-- JOINs are used to combine data from multiple tables.
-- In this system, appointment data is spread across:
--   Patient → Appointment → Doctor_Availability → Doctor → Department
-- JOINs let us retrieve all related information in one query.
-- ============================================================

USE healthcare_system;


-- ============================================================
-- QUERY 1: Patient + Appointment
-- Basic INNER JOIN
-- INNER JOIN returns only rows where there is a match
-- in BOTH tables. Patients with no appointments will not appear.
-- ON p.patient_id = a.patient_id is the join condition —
-- it links each appointment row to the correct patient row.
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
-- The Appointment table does not directly store the doctor_id.
-- Instead it stores availability_id, which links to
-- Doctor_Availability, which links to Doctor.
-- So we need two JOINs to reach the Doctor table.
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
-- This query joins all the main entities together.
-- The relationship chain is:
--   Patient → Appointment → Doctor_Availability → Doctor → Department
-- CONCAT joins first_name and last_name into one column for display.
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
-- Combining JOIN (to bring related tables together) with
-- WHERE (to filter to only COMPLETED appointments).
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
-- ORDER BY d.experience_years DESC sorts the results
-- so the most experienced doctor's appointments appear first.
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
-- GROUP BY groups all rows with the same doctor together.
-- COUNT(a.appointment_id) then counts how many appointments
-- are in each group, giving the workload per doctor.
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
-- Adding WHERE a.status = 'COMPLETED' before GROUP BY
-- means only completed appointments are counted per doctor.
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
-- Similar to Query 6 but without the specialization column.
-- Demonstrates COUNT() as an aggregate function.
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
-- SUM(amount) adds up all the payment amounts.
-- WHERE payment_status = 'PAID' ensures we only sum
-- successfully completed payments, not pending ones.
-- =====================================================

SELECT
    SUM(amount) AS total_payment_amount
FROM Payment
WHERE payment_status = 'PAID';


-- =====================================================
-- QUERY 10: AVG()
-- Average experience of doctors
-- AVG() divides the total experience by the number of
-- doctors, giving the average years of experience.
-- =====================================================

SELECT
    AVG(experience_years) AS average_doctor_experience
FROM Doctor;


-- =====================================================
-- QUERY 11: MAX() and MIN()
-- Highest and lowest doctor experience
-- MAX() finds the doctor with most experience.
-- MIN() finds the doctor with least experience.
-- Both run in the same query for efficiency.
-- =====================================================

SELECT
    MAX(experience_years) AS highest_experience,
    MIN(experience_years) AS lowest_experience
FROM Doctor;


-- =====================================================
-- QUERY 12: HAVING
-- Doctors who have handled more than 1 appointment
-- HAVING is like WHERE but it filters AFTER grouping.
-- Here it filters out doctors with only 1 appointment.
-- WHERE filters rows before grouping; HAVING filters
-- groups after COUNT() has already been calculated.
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
-- The inner query (subquery) runs first and produces a
-- list of patient_ids that have COMPLETED appointments.
-- The outer query then uses IN (...) to select only
-- patients whose ID appears in that list.
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
-- The subquery calculates the average experience
-- across all doctors. The outer query then selects
-- only doctors who have more experience than that average.
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
-- Groups payments by their method (CASH, CARD, UPI, ONLINE)
-- and calculates the average amount paid with each method.
-- Useful for understanding which payment methods are
-- used for larger or smaller transactions.
-- =====================================================

SELECT
    payment_method,
    AVG(amount) AS average_payment
FROM Payment
GROUP BY payment_method;
