# KS3 Computing — Study Pack
# Topic: Databases & SQL
**Year 7–9 | Databases | UK National Curriculum**

---

## Overview

A **database** is an organised, structured collection of data that enables efficient storage, retrieval, and management. Databases power virtually every digital system you interact with — from school administration systems to streaming services, social media platforms, and the NHS. This pack covers how databases are structured, the rules that keep data accurate, and the SQL language used to query them.

---

## Section 1: Data Fundamentals

### Data vs Information

These terms are often used interchangeably but have distinct meanings:

- **Data** = raw, unprocessed facts with no context. On its own, data is meaningless.
- **Information** = data that has been given context and meaning so it can be interpreted and used.

| Example | Data | Information |
|---|---|---|
| A number | `17` | "Student age: 17 years" |
| A series of digits | `07700900123` | "Emergency contact phone number" |
| A word | `"Red"` | "Traffic light status: Red — stop" |

### Flat-File Databases

A **flat-file database** stores all data in a **single table** (like a spreadsheet). Simple to create and understand for small datasets.

**Problems with flat-file databases:**

- **Data redundancy**: the same data is stored multiple times (e.g. a teacher's name appears in every row for every student in their class)
- **Update anomalies**: if one piece of repeated data changes (e.g. the teacher changes their name), every row must be updated — miss one and the data becomes inconsistent
- **Inconsistency**: different rows may contain different versions of the same data
- **Not scalable**: becomes slow and unwieldy with large amounts of data

**Example flat-file (showing redundancy problem):**

| StudentID | StudentName | Subject | TeacherName | TeacherEmail |
|---|---|---|---|---|
| 101 | Alice | Computing | Mr Smith | smith@school.ac.uk |
| 102 | Bob | Computing | Mr Smith | smith@school.ac.uk |
| 103 | Charlie | Computing | Mr Smith | smith@school.ac.uk |

If Mr Smith leaves and Ms Jones takes over, three rows must all be updated. With 300 students, that is 300 changes — and missing even one causes an inconsistency.

### Relational Databases

A **relational database** splits data across **multiple linked tables**, each storing data about one type of entity. Tables are linked using **keys**.

**Benefits:**
- **No redundancy**: teacher data is stored once in the Teachers table, not repeated in every student row
- **No update anomalies**: change the teacher's name once in one row — all linked student records automatically reflect the change
- **Consistency**: only one version of each piece of data exists
- **Scalable**: can handle millions of records efficiently

### Flat-File vs Relational Comparison

| Feature | Flat-File | Relational |
|---|---|---|
| Number of tables | One | Multiple (linked) |
| Data redundancy | High — data repeated in many rows | Low — each fact stored once |
| Update anomalies | Common — must update many rows | Rare — update one record in one table |
| Consistency | Risk of inconsistency | High consistency |
| Complexity | Simple to understand | More complex to design |
| Scalability | Poor | Excellent |

---

## Section 2: Database Structure

### Tables, Fields, and Records

A database is made up of **tables**. Each table stores data about one type of entity (e.g. Students, Teachers, Subjects).

**Terminology:**

| Term | Also called | Description | Example |
|---|---|---|---|
| Table | Relation | Grid of rows and columns storing data about one entity type | `Students` table |
| Field | Column / Attribute | A single category of data — one property of the entity | `Name`, `Age`, `Subject` |
| Record | Row / Tuple | One complete entry — all the data about one individual entity | Row for student Alice: 101, Alice, 15, Computing |

### Sample Students Table

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |
| 104 | Diana | 13 | History | 8 |
| 105 | Ed | 14 | Computing | 9 |

- The **fields** (columns) are: StudentID, Name, Age, Subject, YearGroup
- Each **row** is a **record** — one student's complete data
- `StudentID` is the **primary key**

### Primary Key

The **primary key** is the field (or combination of fields) that **uniquely identifies each record** in a table. Rules:

1. Must be **unique** — no two records can have the same primary key value
2. Must **not be empty (null)** — every record must have a primary key value
3. Should be **stable** — the primary key should not need to change

**Why names cannot be primary keys:** two students could have the same name (Alice Smith and Alice Jones). A primary key must be guaranteed unique — hence the use of generated IDs (StudentID: 101, 102, 103...).

**Choosing a good primary key:**
- StudentID (auto-generated number) — excellent
- Email address — could work (unique) but changes are problematic
- National Insurance number — unique but sensitive data
- Name — poor choice (duplicates possible)

### Foreign Key

A **foreign key** is a field in one table that contains the **primary key from another table**, creating a **link** (relationship) between the two tables.

**Example — linking Students to Teachers:**

**Students table:**

| StudentID | Name | TeacherID |
|---|---|---|
| 101 | Alice | T01 |
| 102 | Bob | T01 |
| 103 | Charlie | T02 |

**Teachers table:**

| TeacherID | TeacherName | Email |
|---|---|---|
| T01 | Mr Smith | smith@school.ac.uk |
| T02 | Ms Jones | jones@school.ac.uk |

- `TeacherID` in the Students table is a **foreign key** — it references the primary key (`TeacherID`) in the Teachers table
- This is how the two tables are linked — to find Alice's teacher's email, follow the TeacherID link from her record to the Teachers table

---

## Section 3: Data Validation and Verification

### Validation

**Validation** is automated checking that data entered is **acceptable, sensible, and within expected parameters**. It is performed by the system before the data is stored.

**Important:** validation checks that data is **reasonable** — it does not guarantee the data is **correct**. A person could enter the wrong (but valid) date of birth.

### Validation Types

| Validation Type | What It Checks | Example |
|---|---|---|
| Presence check | The field cannot be left empty | StudentID must not be blank |
| Range check | The value must be within a specified minimum and maximum | Age must be between 5 and 110 |
| Format check | The data must match a specified pattern | Date must be in format DD/MM/YYYY; postcode must match UK pattern |
| Type check | The data must be the correct data type | Age must be an integer, not text; price must be a decimal |
| Length check | The data must be within a specified character limit | Password must be 8–20 characters; name must not exceed 50 characters |
| Lookup check | The value must exist in a predefined list | Subject must be one of: Computing, Science, History, Geography, Maths |

### Verification

**Verification** is checking that data has been entered **accurately** — that it matches the original source document exactly. This is a human-controlled process, unlike automated validation.

**Verification methods:**

| Method | How It Works |
|---|---|
| Double data entry | Data is entered twice (often by two different people); the system compares both entries and flags any differences |
| Proofreading | A human reads the entered data and compares it against the original document |
| Visual check | The data entry person checks the screen before submitting |

### Validation vs Verification — Key Distinction

| Aspect | Validation | Verification |
|---|---|---|
| What it checks | Is the data reasonable/within rules? | Is the data an accurate copy of the source? |
| Who performs it | The computer system (automated) | A human (or double-entry system) |
| What it catches | Wrong data type, out-of-range, wrong format | Typos, transpositions, copying errors |
| Example | Age = -5 is rejected as out of range | A student's actual age is 15 but 51 was typed |

**Can validation detect wrong-but-valid data?** No. If a student is 15 but the user types 16 by mistake, range check (5–110) will accept 16 as valid. Only verification (proofreading) would catch this.

---

## Section 4: SQL — Structured Query Language

SQL (pronounced "sequel") is the standard language for interacting with relational databases. At KS3, you need to understand how to **retrieve data** using SELECT queries.

### Core SQL Keywords

| Keyword | Purpose | Example |
|---|---|---|
| `SELECT` | Specifies which fields to display | `SELECT Name, Age` |
| `SELECT *` | Select ALL fields | `SELECT *` |
| `FROM` | Specifies which table to query | `FROM Students` |
| `WHERE` | Filters records to only show those matching a condition | `WHERE Age > 14` |
| `ORDER BY` | Sorts results by a specified field | `ORDER BY Name` |
| `ASC` | Sort in ascending order (A→Z, 0→9) — default | `ORDER BY Name ASC` |
| `DESC` | Sort in descending order (Z→A, 9→0) | `ORDER BY Age DESC` |
| `AND` | Both conditions must be true | `WHERE Age > 14 AND Subject = "Computing"` |
| `OR` | At least one condition must be true | `WHERE Subject = "Computing" OR Subject = "Science"` |

### SQL Syntax Structure

```sql
SELECT  field1, field2, field3
FROM    TableName
WHERE   condition1 AND/OR condition2
ORDER BY fieldName ASC/DESC;
```

### Fully Annotated SQL Example

```sql
SELECT Name, Age
FROM Students
WHERE Age > 14 AND Subject = "Computing"
ORDER BY Name ASC;
```

**Line-by-line explanation:**

```
SELECT Name, Age         -- Show only the Name and Age columns (not StudentID, Subject, etc.)
FROM Students            -- Look in the Students table
WHERE Age > 14           -- Only include records where Age is greater than 14...
  AND Subject = "Computing"  -- ...AND where Subject is exactly "Computing"
ORDER BY Name ASC;       -- Sort the results alphabetically by Name (A first)
```

**Applying this query to our sample table:**

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |
| 104 | Diana | 13 | History | 8 |
| 105 | Ed | 14 | Computing | 9 |

- Bob (Age 14): fails `Age > 14` — excluded
- Diana (Age 13, History): fails both conditions — excluded
- Charlie (Science): fails `Subject = "Computing"` — excluded
- Ed (Age 14): fails `Age > 14` — excluded
- Alice (Age 15, Computing): passes both — included

**Result:**

| Name | Age |
|---|---|
| Alice | 15 |

*(Only Alice matches. If there were more Computing students over 14, they would be listed alphabetically.)*

### More SQL Examples

**Select all students in Year 9:**
```sql
SELECT *
FROM Students
WHERE YearGroup = 9;
```

**Select names of students studying History or Geography, sorted by age (oldest first):**
```sql
SELECT Name
FROM Students
WHERE Subject = "History" OR Subject = "Geography"
ORDER BY Age DESC;
```

**Select all students under 15 in Year 8:**
```sql
SELECT Name, Age, Subject
FROM Students
WHERE Age < 15 AND YearGroup = 8;
```

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Data | Raw, unprocessed facts with no context |
| Information | Data given context and meaning so it can be interpreted |
| Database | An organised, structured collection of data |
| Flat-file database | All data in a single table; suffers from redundancy and update anomalies |
| Relational database | Data across multiple linked tables; reduces redundancy |
| Table | A grid of rows and columns storing data about one entity type |
| Field | A single column — one attribute or property of an entity |
| Record | A single row — all data about one entity |
| Primary key | Field that uniquely identifies each record; must be unique and not null |
| Foreign key | Field in one table holding the primary key of another table, creating a relationship |
| Data redundancy | The same data stored multiple times in different places |
| Update anomaly | Inconsistency caused by updating data in one place but not all places it is stored |
| Validation | Automated system check that entered data is acceptable/within rules |
| Verification | Human-based check that entered data accurately matches the source document |
| Presence check | Validation ensuring a field is not left empty |
| Range check | Validation ensuring a value is within specified minimum and maximum |
| Format check | Validation ensuring data matches a required pattern |
| Type check | Validation ensuring data is the correct data type |
| SQL | Structured Query Language — the standard language for querying relational databases |
| SELECT | SQL keyword specifying which fields to display |
| FROM | SQL keyword specifying which table to query |
| WHERE | SQL keyword filtering results to records matching a condition |
| ORDER BY | SQL keyword sorting results by a specified field |

---

## Common Misconceptions

| Misconception | Correction |
|---|---|
| "A database is just a spreadsheet" | A spreadsheet stores flat-file data in one sheet. A relational database has multiple linked tables, enforces data types, supports complex queries, handles millions of records efficiently, and includes primary/foreign key relationships. |
| "The primary key can repeat as long as most values are unique" | No. The primary key must be unique for EVERY record with no exceptions. Even one duplicate defeats the purpose — you can no longer uniquely identify a specific record. |
| "WHERE and ORDER BY do the same thing" | WHERE filters which records are included in the results. ORDER BY sorts the records that have already been selected. They are completely different operations. |
| "Validation proves the data is correct" | Validation only proves data is within acceptable parameters (e.g. age is between 5 and 110). It cannot detect errors that are within range — entering age 16 when the real age is 15 would pass validation. |
| "SQL can only be used to select/retrieve data" | SQL also includes commands for inserting new records (INSERT), updating existing records (UPDATE), deleting records (DELETE), and creating/modifying table structures (CREATE, ALTER, DROP). At KS3 we focus on SELECT. |

---

## Exam-Style Questions

**Q1 [2 marks]**
Explain what is meant by a **primary key** in a database table.

**Q2 [2 marks]**
Describe **one** difference between **validation** and **verification** of data.

**Q3 [3 marks]**
Write an SQL query that selects the `Name` and `Age` of all students who are over 14 years old, sorted alphabetically by name. Use the `Students` table.

**Q4 [4 marks]**
Look at the `Students` table below.

| StudentID | Name | Age | Subject | YearGroup |
|---|---|---|---|---|
| 101 | Alice | 15 | Computing | 10 |
| 102 | Bob | 14 | Computing | 9 |
| 103 | Charlie | 15 | Science | 10 |

(a) Identify the **primary key** in this table. [1 mark]
(b) Identify **one** field that would benefit from a **range check** validation and explain what the range check would do. [2 marks]
(c) Identify **one** type of validation that would be applied to the `StudentID` field. [1 mark]

**Q5 [6 marks]**
Compare flat-file databases with relational databases. Your answer should refer to:
- how data is stored
- data redundancy
- what happens when data needs to be updated
- which is more suitable for a school with 2000 students and 150 teachers

**MCQ**
Which SQL keyword is used to filter records in a query?

A) SELECT
B) ORDER BY
C) FROM
D) WHERE

**Fill in the blanks**
A __________ key uniquely identifies each record in a table. A __________ key in one table links to the primary key in another table, creating a relationship. __________ validation checks that a field is not left empty. In SQL, the __________ keyword is used to specify which table to search, and the __________ keyword sorts the results.

---

## Model Answers

**Q1:** A primary key is a field in a database table that uniquely identifies each record (1). No two records in the table can have the same primary key value, and the field cannot be empty/null (1). **[2 marks]**

**Q2:** Validation is an automated system check that data is within acceptable rules/parameters (e.g. checking a number is within a given range) (1). Verification is checking that the data entered is an accurate copy of the original source — typically done by a human (e.g. proofreading or double data entry) (1). **[2 marks]**

**Q3:**
```sql
SELECT Name, Age
FROM Students
WHERE Age > 14
ORDER BY Name ASC;
```
Award marks for: correct SELECT fields (1), correct WHERE condition (1), correct ORDER BY (1). Penalise but do not withhold all marks for minor syntax issues if intent is clear. **[3 marks]**

**Q4:**
(a) `StudentID` — it is unique for every student and identifies each record. **[1 mark]**
(b) `Age` — a range check would ensure that the age entered is between a sensible minimum (e.g. 11) and maximum (e.g. 18 for a school context), rejecting values like -5 or 200 as impossible. **[2 marks: 1 for identifying field, 1 for explaining what the check does]**
(c) Presence check (the StudentID cannot be empty/null) OR type check (must be an integer). **[1 mark]**

**Q5:** Award 1 mark per valid point, up to 6 marks:
- Flat-file: all data in one table; relational: data spread across multiple linked tables.
- Flat-file has high data redundancy — teacher data would be repeated in every student record; relational stores each teacher's data once in a Teachers table.
- In a flat-file, if a teacher changes name, every student record for that teacher must be updated (update anomaly); in a relational database, only one record in the Teachers table is updated.
- Flat-file may suffer from inconsistency if some rows are updated and others are not; relational is consistent because each fact is stored in only one place.
- For a school with 2000 students and 150 teachers, a relational database is more suitable because it eliminates redundancy, prevents update anomalies, and scales efficiently to this volume of data.

**MCQ:** D — WHERE

**Fill in the blanks:** primary / foreign / Presence / FROM / ORDER BY

---

## Revision Checklist

- [ ] I can explain the difference between data and information with an example
- [ ] I can describe what a flat-file database is and state two problems with it
- [ ] I can explain what a relational database is and state two advantages over flat-file
- [ ] I can define: table, field, record
- [ ] I can explain what a primary key is and why names are often poor choices
- [ ] I can explain what a foreign key is and how it links two tables
- [ ] I can describe six types of validation with examples
- [ ] I can explain the difference between validation and verification
- [ ] I can write a SQL SELECT query using SELECT, FROM, WHERE, and ORDER BY
- [ ] I can use AND/OR to combine conditions in a WHERE clause
- [ ] I can trace through a SQL query on a given table and identify the output
- [ ] I can explain the difference between SELECT * and SELECT specific fields
- [ ] I can identify the primary key, foreign key, and validation rules in a given table
