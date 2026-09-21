-- =====================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- ADVANCED SQL QUERIES
-- File: 03_Advanced_SQL.sql
-- =====================================================


-- =====================================================
-- PART 1: VIEWS
-- =====================================================

-- QUERY 1: Create a view showing appointment details
-- Patient + Doctor + Department + Appointment Status

CREATE OR REPLACE VIEW vw_appointment_details AS
SELECT
    a.appointment_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    dep.department_name,
    a.reason,
    a.status,
    da.available_date,
    da.start_time,
    da.end_time
FROM Appointment a
JOIN Patient p
    ON a.patient_id = p.patient_id
JOIN Doctor_Availability da
    ON a.availability_id = da.availability_id
JOIN Doctor d
    ON da.doctor_id = d.doctor_id
JOIN Department dep
    ON d.department_id = dep.department_id;


-- QUERY 2: Display the view

SELECT *
FROM vw_appointment_details;


-- =====================================================
-- PART 2: STORED PROCEDURES
-- =====================================================

-- QUERY 3: Procedure to get appointments of a particular patient

DELIMITER //

CREATE PROCEDURE GetPatientAppointments(
    IN p_patient_id VARCHAR(10)
)
BEGIN
    SELECT
        a.appointment_id,
        a.reason,
        a.status,
        da.available_date,
        da.start_time,
        da.end_time
    FROM Appointment a
    JOIN Doctor_Availability da
        ON a.availability_id = da.availability_id
    WHERE a.patient_id = p_patient_id;
END //

DELIMITER ;


-- QUERY 4: Execute the procedure

CALL GetPatientAppointments('P001');


-- =====================================================
-- PART 3: STORED FUNCTIONS
-- =====================================================

-- QUERY 5: Function to calculate patient's age
-- Age is calculated from date_of_birth

DELIMITER //

CREATE FUNCTION CalculateAge(
    p_date_of_birth DATE
)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(
        YEAR,
        p_date_of_birth,
        CURDATE()
    );
END //

DELIMITER ;


-- QUERY 6: Use the function

SELECT
    patient_id,
    CONCAT(first_name, ' ', last_name) AS patient_name,
    date_of_birth,
    CalculateAge(date_of_birth) AS age
FROM Patient;


-- =====================================================
-- PART 4: TRIGGERS
-- =====================================================

-- QUERY 7: Trigger to record appointment status changes
-- into Appointment_Audit

DELIMITER //

CREATE TRIGGER trg_appointment_status_update
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN

    IF OLD.status <> NEW.status THEN

        INSERT INTO Appointment_Audit
        (
            appointment_id,
            old_status,
            new_status,
            changed_at,
            changed_by,
            remarks
        )
        VALUES
        (
            NEW.appointment_id,
            OLD.status,
            NEW.status,
            NOW(),
            'SYSTEM',
            'Appointment status changed automatically'
        );

    END IF;

END //

DELIMITER ;


-- QUERY 8: Test the trigger
-- Change an appointment status

UPDATE Appointment
SET status = 'CANCELLED'
WHERE appointment_id = 'AP006';


-- QUERY 9: Check the audit record created by the trigger

SELECT *
FROM Appointment_Audit
WHERE appointment_id = 'AP006'
ORDER BY changed_at DESC;


-- =====================================================
-- PART 5: TRANSACTIONS
-- =====================================================

-- QUERY 10: Transaction for making a payment
-- If everything succeeds -> COMMIT
-- If something goes wrong -> ROLLBACK

START TRANSACTION;

INSERT INTO Payment
(
    payment_id,
    appointment_id,
    amount,
    payment_method,
    payment_status,
    transaction_reference,
    payment_date
)
VALUES
(
    'PAY007',
    'AP006',
    700.00,
    'UPI',
    'PAID',
    'TXN007',
    NOW()
);

COMMIT;


-- QUERY 11: Verify the payment

SELECT *
FROM Payment
WHERE payment_id = 'PAY007';


-- =====================================================
-- END OF ADVANCED SQL
-- =====================================================