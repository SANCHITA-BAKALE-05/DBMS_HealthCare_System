-- =====================================================
-- HEALTHCARE APPOINTMENT & PATIENT ANALYTICS SYSTEM
-- ADVANCED SQL QUERIES
-- File: 03_Advanced_SQL.sql
--
-- PURPOSE:
--   This file demonstrates advanced SQL features used in
--   the healthcare database. These go beyond basic SELECT
--   queries and show how the database can handle complex
--   operations using:
--     1. Views        — saved queries used as virtual tables
--     2. Stored Procedures — reusable SQL programs
--     3. Stored Functions  — custom calculation functions
--     4. Triggers     — automatic actions on data changes
--     5. Transactions — all-or-nothing data operations
-- =====================================================


-- =====================================================
-- PART 1: VIEWS
-- A VIEW is a saved SELECT query stored in the database
-- with a name. You can query it like a normal table.
-- Views are useful for simplifying complex queries —
-- instead of writing all the JOINs every time, you
-- just SELECT from the view.
-- =====================================================

-- QUERY 1: Create a view showing appointment details
-- Patient + Doctor + Department + Appointment Status
-- This view combines 5 tables so that a simple
-- SELECT * FROM vw_appointment_details gives the
-- complete appointment picture without re-writing JOINs.

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
-- Using the view like a normal table.
-- This returns all appointment details without writing JOINs again.

SELECT *
FROM vw_appointment_details;


-- =====================================================
-- PART 2: STORED PROCEDURES
-- A STORED PROCEDURE is a named SQL program stored
-- in the database. You call it with CALL and pass
-- parameters to it. It is like a function in programming.
--
-- Benefit: the procedure is compiled and stored, so
-- it runs faster than sending the full query each time.
-- =====================================================

-- QUERY 3: Procedure to get appointments of a particular patient
-- This procedure accepts a patient_id as input and returns
-- all appointments for that patient.
-- DELIMITER // is used to change the statement separator
-- so MySQL knows where the procedure ends.

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
-- CALL runs the stored procedure with P001 as the input.
-- Replace 'P001' with any patient_id to get their appointments.

CALL GetPatientAppointments('P001');


-- =====================================================
-- PART 3: STORED FUNCTIONS
-- A STORED FUNCTION is similar to a procedure but it
-- RETURNS a single value. You can use it inside SELECT
-- statements just like a built-in function.
--
-- DETERMINISTIC means the function always returns the
-- same result for the same input (required for MySQL).
-- =====================================================

-- QUERY 5: Function to calculate patient's age
-- Age is calculated from date_of_birth
-- TIMESTAMPDIFF(YEAR, birth_date, today) returns the
-- difference in years between two dates.

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
-- CalculateAge(date_of_birth) is called for each patient row.
-- The function returns the patient's current age in years.

SELECT
    patient_id,
    CONCAT(first_name, ' ', last_name) AS patient_name,
    date_of_birth,
    CalculateAge(date_of_birth) AS age
FROM Patient;


-- =====================================================
-- PART 4: TRIGGERS
-- A TRIGGER is SQL code that runs AUTOMATICALLY when a
-- specific event happens on a table (INSERT, UPDATE, or DELETE).
--
-- In this project, the trigger records every change to
-- an appointment's status into the Appointment_Audit table.
-- This happens automatically — no application code needed.
--
-- AFTER UPDATE means the trigger fires after the UPDATE
-- completes successfully.
-- FOR EACH ROW means the trigger runs once per updated row.
-- OLD.status = the status value before the update
-- NEW.status = the status value after the update
-- =====================================================

-- QUERY 7: Trigger to record appointment status changes
-- into Appointment_Audit
-- The IF OLD.status <> NEW.status check ensures we only
-- log changes — if someone updates a row but the status
-- stays the same, no audit record is created.

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
-- This UPDATE will fire the trigger, which automatically
-- inserts a row into Appointment_Audit.

UPDATE Appointment
SET status = 'CANCELLED'
WHERE appointment_id = 'AP006';


-- QUERY 9: Check the audit record created by the trigger
-- After the UPDATE above, check the Appointment_Audit table
-- to confirm the trigger inserted a record automatically.

SELECT *
FROM Appointment_Audit
WHERE appointment_id = 'AP006'
ORDER BY changed_at DESC;


-- =====================================================
-- PART 5: TRANSACTIONS
-- A TRANSACTION groups multiple SQL statements together
-- so they succeed or fail as a single unit.
--
-- START TRANSACTION — begin the transaction
-- COMMIT            — save all changes permanently
-- ROLLBACK          — undo all changes (if something fails)
--
-- In this example, a payment is inserted.
-- If the INSERT succeeds → COMMIT saves it.
-- If anything goes wrong → ROLLBACK cancels it.
-- This prevents partial data (e.g. half a payment record).
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
-- After COMMIT, the payment should be visible in the table.

SELECT *
FROM Payment
WHERE payment_id = 'PAY007';


-- =====================================================
-- END OF ADVANCED SQL
-- =====================================================
