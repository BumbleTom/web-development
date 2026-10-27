-- =========================
-- CREATE TABLES
-- =========================

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    instructor TEXT NOT NULL
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    UNIQUE(student_id, course_id)
);

-- =========================
-- SAMPLE DATA
-- =========================

INSERT INTO students
(name, email)
VALUES
('Belinda Wanjiru', 'belinda@email.com'),
('John Kamau', 'john@email.com'),
('Grace Njeri', 'grace@email.com');

INSERT INTO courses
(course_name, instructor)
VALUES
('Web Foundations', 'Mr. Smith'),
('Database Systems', 'Mrs. Patel'),
('JavaScript Programming', 'Mr. Otieno');

INSERT INTO enrolments
(student_id, course_id, grade)
VALUES
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'A'),
(2, 3, 'C'),
(3, 2, 'A');

-- =========================
-- QUERY 1
-- All courses for one student
-- =========================

SELECT
    students.name,
    courses.course_name
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON courses.course_id = enrolments.course_id
WHERE students.name = 'Belinda Wanjiru';

-- =========================
-- QUERY 2
-- All students on one course
-- =========================

SELECT
    courses.course_name,
    students.name
FROM courses
JOIN enrolments
    ON courses.course_id = enrolments.course_id
JOIN students
    ON students.student_id = enrolments.student_id
WHERE courses.course_name = 'Web Foundations';

-- =========================
-- QUERY 3
-- Number of students per course
-- =========================

SELECT
    courses.course_name,
    COUNT(enrolments.student_id)
    AS student_count
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_name;

-- =========================
-- QUERY 4
-- Students with no enrolments
-- =========================

SELECT
    students.name
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.student_id IS NULL;

-- =========================
-- QUERY 5
-- Update one enrolment grade
-- =========================

UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 2;