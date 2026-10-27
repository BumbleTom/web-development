# School Database Design

## Tables

### Students

The students table stores information about each student. Each student has a unique student_id, a name, and a unique email address.

### Courses

The courses table stores information about available courses. Each course has a unique course_id, a course name, and an instructor.

### Enrolments

The enrolments table records which students are enrolled in which courses. It also stores the grade achieved for a course.

---

## Relationships

### Students → Enrolments

This is a one-to-many relationship because one student can have many enrolments.

### Courses → Enrolments

This is a one-to-many relationship because one course can have many enrolled students.

### Students ↔ Courses

This is a many-to-many relationship because:

- A student can take many courses.
- A course can have many students.

A join table (enrolments) is needed because relational databases cannot directly store many-to-many relationships. The enrolments table links students and courses together.

---

## Index Recommendation

I would add an index on the email column in the students table.

Example:

```sql
CREATE INDEX idx_student_email
ON students(email);
```

Reason:

Student records are often searched using email addresses. An index would make those searches faster.

---

## SQL vs NoSQL

I would choose SQL for this system because the data is highly structured and the relationships between students, courses, and enrolments are important. SQL databases provide primary keys, foreign keys, and constraints that help maintain data integrity. Since schools need accurate enrolment and grading records, a relational database is more suitable than a NoSQL solution.