-- =====================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- ANALYTICS QUERIES
-- File: 04_Analytics.sql
-- =====================================================


-- =====================================================
-- QUERY 1: TOTAL NUMBER OF PATIENTS
-- Basic patient population analysis
-- =====================================================

SELECT
    COUNT(*) AS total_patients
FROM Patient;


-- =====================================================
-- QUERY 2: TOTAL NUMBER OF DOCTORS
-- =====================================================

SELECT
    COUNT(*) AS total_doctors
FROM Doctor;


-- =====================================================
-- QUERY 3: APPOINTMENT STATUS ANALYSIS
-- Count appointments according to their status
-- =====================================================

SELECT
    status,
    COUNT(*) AS total_appointments
FROM Appointment
GROUP BY status
ORDER BY total_appointments DESC;


-- =====================================================
-- QUERY 4: DEPARTMENT-WISE APPOINTMENT ANALYSIS
-- Number of appointments handled by each department
-- =====================================================

SELECT
    dep.department_name,
    COUNT(a.appointment_id) AS total_appointments
FROM Department dep
JOIN Doctor d
    ON dep.department_id = d.department_id
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
GROUP BY
    dep.department_id,
    dep.department_name
ORDER BY total_appointments DESC;


-- =====================================================
-- QUERY 5: DOCTOR-WISE APPOINTMENT LOAD
-- Number of appointments handled by each doctor
-- =====================================================

SELECT
    d.doctor_id,
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
    d.specialization
ORDER BY total_appointments DESC;


-- =====================================================
-- QUERY 6: COMPLETED APPOINTMENTS BY DEPARTMENT
-- Useful for department performance analysis
-- =====================================================

SELECT
    dep.department_name,
    COUNT(a.appointment_id) AS completed_appointments
FROM Department dep
JOIN Doctor d
    ON dep.department_id = d.department_id
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
WHERE a.status = 'COMPLETED'
GROUP BY
    dep.department_id,
    dep.department_name
ORDER BY completed_appointments DESC;


-- =====================================================
-- QUERY 7: TOTAL REVENUE
-- Calculate revenue from successful payments
-- =====================================================

SELECT
    SUM(amount) AS total_revenue
FROM Payment
WHERE payment_status = 'PAID';


-- =====================================================
-- QUERY 8: REVENUE BY PAYMENT METHOD
-- Analyze revenue generated through each payment method
-- =====================================================

SELECT
    payment_method,
    COUNT(payment_id) AS total_transactions,
    SUM(amount) AS total_revenue
FROM Payment
WHERE payment_status = 'PAID'
GROUP BY payment_method
ORDER BY total_revenue DESC;


-- =====================================================
-- QUERY 9: AVERAGE PAYMENT AMOUNT
-- Average amount paid per successful transaction
-- =====================================================

SELECT
    AVG(amount) AS average_payment_amount
FROM Payment
WHERE payment_status = 'PAID';


-- =====================================================
-- QUERY 10: PATIENTS WITH MULTIPLE APPOINTMENTS
-- Identify patients who visited more than once
-- =====================================================

SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    COUNT(a.appointment_id) AS total_appointments
FROM Patient p
JOIN Appointment a
    ON p.patient_id = a.patient_id
GROUP BY
    p.patient_id,
    p.first_name,
    p.last_name
HAVING COUNT(a.appointment_id) > 1
ORDER BY total_appointments DESC;


-- =====================================================
-- QUERY 11: AVERAGE DOCTOR EXPERIENCE BY DEPARTMENT
-- Compare experience levels across departments
-- =====================================================

SELECT
    dep.department_name,
    AVG(d.experience_years) AS average_experience
FROM Department dep
JOIN Doctor d
    ON dep.department_id = d.department_id
GROUP BY
    dep.department_id,
    dep.department_name
ORDER BY average_experience DESC;


-- =====================================================
-- QUERY 12: FEEDBACK / RATING ANALYSIS
-- Average rating received by each doctor
-- =====================================================

SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    AVG(f.rating) AS average_rating,
    COUNT(f.feedback_id) AS total_feedback
FROM Doctor d
JOIN Doctor_Availability da
    ON d.doctor_id = da.doctor_id
JOIN Appointment a
    ON da.availability_id = a.availability_id
JOIN Feedback f
    ON a.appointment_id = f.appointment_id
GROUP BY
    d.doctor_id,
    d.first_name,
    d.last_name
ORDER BY average_rating DESC;


-- =====================================================
-- QUERY 13: MEDICAL RECORD ANALYSIS
-- Average health measurements across patients
-- =====================================================

SELECT
    AVG(blood_sugar) AS average_blood_sugar,
    AVG(heart_rate) AS average_heart_rate,
    AVG(weight) AS average_weight
FROM Medical_Record;


-- =====================================================
-- QUERY 14: PATIENT MEDICAL RECORD COUNT
-- Number of medical records for each patient
-- =====================================================

SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    COUNT(mr.record_id) AS total_medical_records
FROM Patient p
LEFT JOIN Medical_Record mr
    ON p.patient_id = mr.patient_id
GROUP BY
    p.patient_id,
    p.first_name,
    p.last_name
ORDER BY total_medical_records DESC;


-- =====================================================
-- QUERY 15: PRESCRIPTION ANALYSIS
-- Number of prescription items issued
-- =====================================================

SELECT
    COUNT(pi.prescription_item_id) AS total_prescription_items
FROM Prescription_Item pi;


-- =====================================================
-- QUERY 16: MOST PRESCRIBED MEDICINES
-- Find medicines that appear most frequently
-- =====================================================

SELECT
    medicine_name,
    COUNT(*) AS prescription_count
FROM Prescription_Item
GROUP BY medicine_name
ORDER BY prescription_count DESC;


-- =====================================================
-- QUERY 17: APPOINTMENT COMPLETION RATE
-- Calculate percentage of completed appointments
-- =====================================================

SELECT
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)
        AS completed_appointments,

    COUNT(*) AS total_appointments,

    ROUND(
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)
        * 100.0 / COUNT(*),
        2
    ) AS completion_rate_percentage

FROM Appointment;


-- =====================================================
-- QUERY 18: PATIENT AGE ANALYSIS
-- Categorize patients into age groups
-- =====================================================

SELECT
    CASE
        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18
            THEN 'Below 18'

        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 40
            THEN '18-40'

        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 60
            THEN '41-60'

        ELSE 'Above 60'
    END AS age_group,

    COUNT(*) AS total_patients

FROM Patient

GROUP BY age_group

ORDER BY total_patients DESC;


-- =====================================================
-- QUERY 19: DOCTORS WITH HIGH APPOINTMENT LOAD
-- Doctors handling at least 2 appointments
-- =====================================================

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
    d.specialization
HAVING COUNT(a.appointment_id) >= 2
ORDER BY total_appointments DESC;


-- =====================================================
-- QUERY 20: COMPLETE PATIENT APPOINTMENT ANALYTICS
-- Patient + Doctor + Department + Appointment + Payment
-- =====================================================

SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,

    COUNT(DISTINCT a.appointment_id) AS total_appointments,

    COUNT(
        DISTINCT CASE
            WHEN a.status = 'COMPLETED'
            THEN a.appointment_id
        END
    ) AS completed_appointments,

    COALESCE(SUM(
        CASE
            WHEN pay.payment_status = 'PAID'
            THEN pay.amount
            ELSE 0
        END
    ), 0) AS total_amount_paid

FROM Patient p

LEFT JOIN Appointment a
    ON p.patient_id = a.patient_id

LEFT JOIN Payment pay
    ON a.appointment_id = pay.appointment_id

GROUP BY
    p.patient_id,
    p.first_name,
    p.last_name

ORDER BY total_appointments DESC;


-- =====================================================
-- END OF ANALYTICS
-- =====================================================