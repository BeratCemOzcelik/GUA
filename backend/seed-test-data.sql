-- =============================================================================
-- GUA - KAPSAMLI TEST VERİSİ
-- =============================================================================
-- Bu script tum sistemi test edebilmeniz icin gerekli verileri olusturur.
-- Siralama onemlidir: foreign key iliskilerine gore siralanmistir.
--
-- KULLANICI SIFRELER: Tumu "Test1234!" seklindedir.
-- ADMIN: admin@gua.edu.pl / Test1234!
--
-- CALISTIRMAK ICIN:
--   psql -U postgres -d gua_db -f seed-test-data.sql
--   veya pgAdmin'den calistirin
-- =============================================================================

-- TUM VERILERI TEMIZLE (Roles tablosu haric - seed data)
-- TRUNCATE CASCADE tum bagli tablolari otomatik temizler
TRUNCATE TABLE "AssignmentSubmissions" CASCADE;
TRUNCATE TABLE "Grades" CASCADE;
TRUNCATE TABLE "FinalGrades" CASCADE;
TRUNCATE TABLE "GPARecords" CASCADE;
TRUNCATE TABLE "Transcripts" CASCADE;
TRUNCATE TABLE "Enrollments" CASCADE;
TRUNCATE TABLE "GradeComponents" CASCADE;
TRUNCATE TABLE "CourseMaterials" CASCADE;
TRUNCATE TABLE "CourseOfferings" CASCADE;
TRUNCATE TABLE "ApplicationDocuments" CASCADE;
TRUNCATE TABLE "Applications" CASCADE;
TRUNCATE TABLE "CoursePrerequisites" CASCADE;
TRUNCATE TABLE "BlogPosts" CASCADE;
TRUNCATE TABLE "GalleryItems" CASCADE;
TRUNCATE TABLE "AuditLogs" CASCADE;
TRUNCATE TABLE "StudentProfiles" CASCADE;
TRUNCATE TABLE "FacultyProfiles" CASCADE;
TRUNCATE TABLE "UserRoles" CASCADE;
TRUNCATE TABLE "Users" CASCADE;
TRUNCATE TABLE "Courses" CASCADE;
TRUNCATE TABLE "Programs" CASCADE;
TRUNCATE TABLE "Departments" CASCADE;
TRUNCATE TABLE "AcademicTerms" CASCADE;

-- Roles tablosunu yeniden seed et (TRUNCATE CASCADE silebilir)
INSERT INTO "Roles" ("Id", "Name", "Description") VALUES
(1, 'SuperAdmin', 'Full system access'),
(2, 'Admin', 'Administrative access'),
(3, 'Faculty', 'Faculty member access'),
(4, 'Student', 'Student access')
ON CONFLICT ("Id") DO NOTHING;

-- =============================================================================
-- 1. DEPARTMENTS (Bölümler)
-- =============================================================================
INSERT INTO "Departments" ("Name", "Code", "Description", "IsActive", "CreatedAt") VALUES
('Computer Science', 'CS', 'Department of Computer Science covers programming, algorithms, data structures, artificial intelligence, and software engineering.', true, NOW()),
('Business Administration', 'BA', 'Department of Business Administration focuses on management, finance, marketing, and entrepreneurship.', true, NOW()),
('English Language & Literature', 'ENG', 'Department of English Language & Literature offers programs in linguistics, creative writing, and literary analysis.', true, NOW()),
('Data Science', 'DS', 'Department of Data Science combines statistics, programming, and domain expertise for data-driven decision making.', true, NOW());

-- =============================================================================
-- 2. PROGRAMS (Programlar)
-- =============================================================================
INSERT INTO "Programs" ("DepartmentId", "Name", "DegreeType", "TotalCreditsRequired", "DurationYears", "Description", "Requirements", "TuitionFee", "IsActive", "CreatedAt") VALUES
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'Computer Science', 2, 240, 4,
 'Our Computer Science program prepares students for careers in software development, cybersecurity, AI, and more. Students gain hands-on experience through projects and internships.',
 'High school diploma or equivalent. Basic mathematics proficiency required.', 15000.00, true, NOW()),

((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'Business Administration', 2, 240, 4,
 'The Business Administration program develops future business leaders with a strong foundation in management, finance, and strategic thinking.',
 'High school diploma or equivalent.', 14000.00, true, NOW()),

((SELECT "Id" FROM "Departments" WHERE "Code" = 'ENG'), 'English Language & Literature', 2, 240, 4,
 'Explore the richness of English language and literature through comprehensive coursework in linguistics, creative writing, and critical analysis.',
 'High school diploma. English proficiency test required.', 12000.00, true, NOW()),

((SELECT "Id" FROM "Departments" WHERE "Code" = 'DS'), 'Data Science', 3, 120, 2,
 'Our Master''s in Data Science program equips students with advanced skills in machine learning, big data analytics, and statistical modeling.',
 'Bachelor''s degree in a related field. GPA 3.0+ required.', 18000.00, true, NOW()),

((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'MBA', 3, 120, 2,
 'The MBA program offers a rigorous curriculum designed for professionals seeking to advance their careers in management and leadership.',
 'Bachelor''s degree. Minimum 2 years of work experience.', 22000.00, true, NOW());

-- =============================================================================
-- 3. COURSES (Dersler)
-- =============================================================================
INSERT INTO "Courses" ("DepartmentId", "Code", "Name", "Credits", "Description", "Syllabus", "IsActive", "CreatedAt") VALUES
-- CS Dersleri
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'CS101', 'Introduction to Programming', 6, 'Learn the fundamentals of programming using Python. Topics include variables, loops, functions, and basic data structures.', 'Week 1-4: Python Basics, Week 5-8: Data Structures, Week 9-12: OOP, Week 13-15: Projects', true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'CS102', 'Data Structures & Algorithms', 6, 'Study fundamental data structures and algorithms including arrays, linked lists, trees, graphs, sorting, and searching.', 'Week 1-3: Arrays & Linked Lists, Week 4-6: Trees & Heaps, Week 7-9: Graphs, Week 10-12: Sorting, Week 13-15: Dynamic Programming', true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'CS201', 'Database Systems', 6, 'Introduction to database design, SQL, normalization, and transaction management. Covers both relational and NoSQL databases.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'CS202', 'Web Development', 6, 'Full-stack web development covering HTML, CSS, JavaScript, React, Node.js, and REST API design.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'CS'), 'CS301', 'Artificial Intelligence', 6, 'Explore AI concepts including search algorithms, machine learning, neural networks, and natural language processing.', NULL, true, NOW()),

-- BA Dersleri
((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'BA101', 'Principles of Management', 6, 'Introduction to management theories, organizational behavior, planning, and leadership.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'BA102', 'Financial Accounting', 6, 'Learn the fundamentals of financial accounting including balance sheets, income statements, and cash flow analysis.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'BA201', 'Marketing Management', 6, 'Study marketing strategies, consumer behavior, digital marketing, and brand management.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'BA'), 'BA301', 'Strategic Management', 6, 'Advanced course on corporate strategy, competitive analysis, and strategic decision-making.', NULL, true, NOW()),

-- ENG Dersleri
((SELECT "Id" FROM "Departments" WHERE "Code" = 'ENG'), 'ENG101', 'Academic Writing', 4, 'Develop academic writing skills including essay structure, argumentation, and research paper composition.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'ENG'), 'ENG102', 'Introduction to Linguistics', 4, 'Study the science of language including phonetics, morphology, syntax, and semantics.', NULL, true, NOW()),
((SELECT "Id" FROM "Departments" WHERE "Code" = 'ENG'), 'ENG201', 'British Literature', 4, 'Survey of British literature from the medieval period to the modern era.', NULL, true, NOW());

-- =============================================================================
-- 4. COURSE PREREQUISITES (Ders Onkosullari)
-- =============================================================================
INSERT INTO "CoursePrerequisites" ("CourseId", "PrerequisiteCourseId") VALUES
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS102'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101')),
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS201'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101')),
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS202'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101')),
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS301'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'CS102')),
((SELECT "Id" FROM "Courses" WHERE "Code" = 'BA201'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'BA101')),
((SELECT "Id" FROM "Courses" WHERE "Code" = 'BA301'), (SELECT "Id" FROM "Courses" WHERE "Code" = 'BA201'));

-- =============================================================================
-- 5. ACADEMIC TERMS (Akademik Donemler)
-- =============================================================================
INSERT INTO "AcademicTerms" ("Name", "Code", "StartDate", "EndDate", "IsActive", "EnrollmentStartDate", "EnrollmentEndDate", "CreatedAt") VALUES
('Fall 2025', '2025-FALL', '2025-09-15', '2026-01-15', true, '2025-08-01', '2025-09-10', NOW()),
('Spring 2025', '2025-SPRING', '2025-02-10', '2025-06-15', false, '2025-01-15', '2025-02-05', NOW()),
('Summer 2025', '2025-SUMMER', '2025-07-01', '2025-08-30', false, '2025-06-15', '2025-06-28', NOW());

-- =============================================================================
-- 6. USERS (Kullanicilar)
-- BCrypt hash: "Test1234!" => $2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S
-- =============================================================================

-- SuperAdmin (ana admin hesabi - DbSeeder ile ayni)
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FirstName", "LastName", "PhoneNumber", "IsActive", "CreatedAt") VALUES
('d0000001-0000-0000-0000-000000000001', 'admin@gua.edu.pl', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'System', 'Administrator', NULL, true, NOW());

INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedAt") VALUES
('d0000001-0000-0000-0000-000000000001', 1, NOW());

-- Faculty (Hocalar)
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FirstName", "LastName", "PhoneNumber", "IsActive", "CreatedAt") VALUES
('a0000001-0000-0000-0000-000000000001', 'prof.smith@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'John', 'Smith', '+1-555-0101', true, NOW()),
('a0000001-0000-0000-0000-000000000002', 'prof.johnson@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Emily', 'Johnson', '+1-555-0102', true, NOW()),
('a0000001-0000-0000-0000-000000000003', 'prof.williams@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Robert', 'Williams', '+1-555-0103', true, NOW()),
('a0000001-0000-0000-0000-000000000004', 'prof.brown@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Sarah', 'Brown', '+1-555-0104', true, NOW());

-- Students (Ogrenciler)
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FirstName", "LastName", "PhoneNumber", "IsActive", "CreatedAt") VALUES
('b0000001-0000-0000-0000-000000000001', 'ali.yilmaz@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Ali', 'Yilmaz', '+90-555-1001', true, NOW()),
('b0000001-0000-0000-0000-000000000002', 'ayse.demir@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Ayse', 'Demir', '+90-555-1002', true, NOW()),
('b0000001-0000-0000-0000-000000000003', 'mehmet.kaya@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Mehmet', 'Kaya', '+90-555-1003', true, NOW()),
('b0000001-0000-0000-0000-000000000004', 'emma.wilson@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Emma', 'Wilson', '+1-555-2001', true, NOW()),
('b0000001-0000-0000-0000-000000000005', 'james.taylor@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'James', 'Taylor', '+1-555-2002', true, NOW());

-- Admin
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FirstName", "LastName", "PhoneNumber", "IsActive", "CreatedAt") VALUES
('c0000001-0000-0000-0000-000000000001', 'admin2@test.gua.edu', '$2a$11$A/chMPXbrskG8F9/2S9aduzOa2NOO2sH4KLOoQiGEuCgr06dfQA0S', 'Test', 'Admin', '+1-555-9001', true, NOW());

-- =============================================================================
-- 7. USER ROLES (Kullanici Rolleri)
-- =============================================================================
-- Faculty rolü (RoleId=3)
INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedAt") VALUES
('a0000001-0000-0000-0000-000000000001', 3, NOW()),
('a0000001-0000-0000-0000-000000000002', 3, NOW()),
('a0000001-0000-0000-0000-000000000003', 3, NOW()),
('a0000001-0000-0000-0000-000000000004', 3, NOW());

-- Student rolü (RoleId=4)
INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedAt") VALUES
('b0000001-0000-0000-0000-000000000001', 4, NOW()),
('b0000001-0000-0000-0000-000000000002', 4, NOW()),
('b0000001-0000-0000-0000-000000000003', 4, NOW()),
('b0000001-0000-0000-0000-000000000004', 4, NOW()),
('b0000001-0000-0000-0000-000000000005', 4, NOW());

-- Admin rolü (RoleId=2)
INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedAt") VALUES
('c0000001-0000-0000-0000-000000000001', 2, NOW());

-- =============================================================================
-- 8. FACULTY PROFILES (Hoca Profilleri)
-- =============================================================================
INSERT INTO "FacultyProfiles" ("UserId", "Title", "Bio", "ResearchInterests", "OfficeLocation", "OfficeHours", "PhotoUrl", "LinkedInUrl", "GoogleScholarUrl", "CreatedAt") VALUES
('a0000001-0000-0000-0000-000000000001', 'Professor of Computer Science',
 'Dr. John Smith has over 20 years of experience in software engineering and artificial intelligence. He has published more than 50 research papers in top-tier conferences and journals.',
 'Artificial Intelligence, Machine Learning, Software Engineering, Cloud Computing',
 'Building A, Room 301', 'Monday & Wednesday 14:00-16:00', NULL,
 'https://linkedin.com/in/example', NULL, NOW()),

('a0000001-0000-0000-0000-000000000002', 'Associate Professor of Business',
 'Dr. Emily Johnson specializes in strategic management and entrepreneurship. She has consulted for Fortune 500 companies and authored two bestselling business books.',
 'Strategic Management, Entrepreneurship, Digital Transformation, Leadership',
 'Building B, Room 205', 'Tuesday & Thursday 10:00-12:00', NULL,
 NULL, NULL, NOW()),

('a0000001-0000-0000-0000-000000000003', 'Assistant Professor of English',
 'Dr. Robert Williams is a published author and linguist with expertise in modern British literature and creative writing pedagogy.',
 'Modern British Literature, Creative Writing, Applied Linguistics',
 'Building C, Room 102', 'Friday 09:00-12:00', NULL,
 NULL, NULL, NOW()),

('a0000001-0000-0000-0000-000000000004', 'Professor of Data Science',
 'Dr. Sarah Brown is a leading researcher in big data analytics and statistical modeling with industry experience at Google and Microsoft.',
 'Big Data Analytics, Statistical Modeling, Deep Learning, NLP',
 'Building A, Room 405', 'Monday & Friday 13:00-15:00', NULL,
 'https://linkedin.com/in/example2', NULL, NOW());

-- =============================================================================
-- 9. STUDENT PROFILES (Ogrenci Profilleri)
-- =============================================================================
INSERT INTO "StudentProfiles" ("UserId", "StudentNumber", "ProgramId", "EnrollmentDate", "ExpectedGraduationDate", "CurrentGPA", "TotalCreditsEarned", "AcademicStatus", "Address", "City", "Country", "DateOfBirth", "CreatedAt") VALUES
('b0000001-0000-0000-0000-000000000001', 'GUA-20250001',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Computer Science' LIMIT 1),
 '2025-09-15', '2029-06-15', 3.45, 30, 1, 'Istanbul, Kadikoy', 'Istanbul', 'Turkey', '2002-05-15', NOW()),

('b0000001-0000-0000-0000-000000000002', 'GUA-20250002',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Business Administration' LIMIT 1),
 '2025-09-15', '2029-06-15', 3.72, 24, 1, 'Ankara, Cankaya', 'Ankara', 'Turkey', '2003-01-22', NOW()),

('b0000001-0000-0000-0000-000000000003', 'GUA-20250003',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Computer Science' LIMIT 1),
 '2025-09-15', '2029-06-15', 2.85, 18, 1, 'Izmir, Bornova', 'Izmir', 'Turkey', '2002-11-08', NOW()),

('b0000001-0000-0000-0000-000000000004', 'GUA-20250004',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'English Language & Literature' LIMIT 1),
 '2025-09-15', '2029-06-15', 3.90, 28, 1, '123 Main St', 'Boston', 'USA', '2001-07-30', NOW()),

('b0000001-0000-0000-0000-000000000005', 'GUA-20250005',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Data Science' LIMIT 1),
 '2025-09-15', '2027-06-15', 3.60, 15, 1, '456 Oak Ave', 'New York', 'USA', '1999-03-14', NOW());

-- =============================================================================
-- 10. COURSE OFFERINGS (Ders Acilimlari - Donem bazli)
-- =============================================================================
INSERT INTO "CourseOfferings" ("CourseId", "TermId", "FacultyProfileId", "Section", "Capacity", "EnrolledCount", "Schedule", "Location", "IsActive", "CreatedAt") VALUES
-- Fall 2025 - Prof. Smith (CS)
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'A', 40, 3, 'Mon/Wed 09:00-11:00', 'Room 101 - Computer Lab', true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS102'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'A', 35, 2, 'Tue/Thu 13:00-15:00', 'Room 102 - Computer Lab', true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS201'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'A', 30, 1, 'Wed/Fri 14:00-16:00', 'Room 201', true, NOW()),

-- Fall 2025 - Prof. Johnson (BA)
((SELECT "Id" FROM "Courses" WHERE "Code" = 'BA101'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000002'),
 'A', 50, 1, 'Mon/Wed 10:00-12:00', 'Room 301 - Lecture Hall', true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'BA102'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000002'),
 'A', 50, 1, 'Tue/Thu 10:00-12:00', 'Room 302', true, NOW()),

-- Fall 2025 - Prof. Williams (ENG)
((SELECT "Id" FROM "Courses" WHERE "Code" = 'ENG101'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000003'),
 'A', 30, 1, 'Mon/Wed/Fri 11:00-12:00', 'Room 401', true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'ENG102'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000003'),
 'A', 30, 1, 'Tue/Thu 09:00-11:00', 'Room 402', true, NOW()),

-- Fall 2025 - Prof. Brown (DS)
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS301'),
 (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL'),
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000004'),
 'A', 25, 1, 'Mon/Wed 15:00-17:00', 'Room 501 - AI Lab', true, NOW());

-- =============================================================================
-- 11. ENROLLMENTS (Kayitlar)
-- =============================================================================
-- Ali Yilmaz -> CS101, CS102, CS201 (CS ogrencisi)
INSERT INTO "Enrollments" ("StudentId", "CourseOfferingId", "EnrollmentDate", "Status", "CreatedAt") VALUES
((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250001'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW()),

((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250001'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS102' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW()),

((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250001'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS201' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW());

-- Ayse Demir -> BA101, BA102 (BA ogrencisi)
INSERT INTO "Enrollments" ("StudentId", "CourseOfferingId", "EnrollmentDate", "Status", "CreatedAt") VALUES
((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250002'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW());

-- Mehmet Kaya -> CS101, CS102 (CS ogrencisi)
INSERT INTO "Enrollments" ("StudentId", "CourseOfferingId", "EnrollmentDate", "Status", "CreatedAt") VALUES
((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250003'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW()),

((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250003'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS102' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW());

-- Emma Wilson -> ENG101, ENG102 (ENG ogrencisi)
INSERT INTO "Enrollments" ("StudentId", "CourseOfferingId", "EnrollmentDate", "Status", "CreatedAt") VALUES
((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250004'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW()),

((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250004'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG102' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW());

-- James Taylor -> CS301 (DS master ogrencisi)
INSERT INTO "Enrollments" ("StudentId", "CourseOfferingId", "EnrollmentDate", "Status", "CreatedAt") VALUES
((SELECT "Id" FROM "StudentProfiles" WHERE "StudentNumber" = 'GUA-20250005'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS301' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 '2025-09-01', 1, NOW());

-- =============================================================================
-- 12. GRADE COMPONENTS (Not Bilesenleri)
-- =============================================================================
-- CS101 not bilesenleri
INSERT INTO "GradeComponents" ("CourseOfferingId", "Name", "Type", "Weight", "MaxScore", "DueDate", "IsPublished", "CreatedAt") VALUES
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Assignment 1 - Python Basics', 1, 10.00, 100.00, '2025-10-01', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Assignment 2 - Data Structures', 1, 10.00, 100.00, '2025-11-01', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Midterm Exam', 3, 30.00, 100.00, '2025-11-15', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Final Project', 5, 25.00, 100.00, '2026-01-10', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Final Exam', 4, 25.00, 100.00, '2026-01-15', false, NOW());

-- BA101 not bilesenleri
INSERT INTO "GradeComponents" ("CourseOfferingId", "Name", "Type", "Weight", "MaxScore", "DueDate", "IsPublished", "CreatedAt") VALUES
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Case Study Report', 1, 20.00, 100.00, '2025-10-15', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Midterm Exam', 3, 30.00, 100.00, '2025-11-10', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Group Presentation', 6, 20.00, 100.00, '2025-12-01', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Final Exam', 4, 30.00, 100.00, '2026-01-12', false, NOW());

-- ENG101 not bilesenleri
INSERT INTO "GradeComponents" ("CourseOfferingId", "Name", "Type", "Weight", "MaxScore", "DueDate", "IsPublished", "CreatedAt") VALUES
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Essay 1 - Argumentative Writing', 1, 20.00, 100.00, '2025-10-10', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Essay 2 - Research Paper', 1, 25.00, 100.00, '2025-11-20', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Participation', 7, 15.00, 100.00, NULL, true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Final Exam', 4, 40.00, 100.00, '2026-01-14', false, NOW());

-- CS301 not bilesenleri
INSERT INTO "GradeComponents" ("CourseOfferingId", "Name", "Type", "Weight", "MaxScore", "DueDate", "IsPublished", "CreatedAt") VALUES
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS301' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'ML Project Proposal', 1, 15.00, 100.00, '2025-10-15', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS301' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Midterm Exam', 3, 25.00, 100.00, '2025-11-12', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS301' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'AI Research Paper', 1, 30.00, 100.00, '2025-12-15', true, NOW()),
((SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS301' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Final Exam', 4, 30.00, 100.00, '2026-01-13', false, NOW());

-- =============================================================================
-- 13. GRADES (Notlar - Bazi odevler icin not girilmis)
-- =============================================================================
-- Ali Yilmaz - CS101 notlari (Assignment 1 ve Midterm icin)
INSERT INTO "Grades" ("EnrollmentId", "GradeComponentId", "Score", "GradedAt", "GradedByFacultyId", "Comments", "CreatedAt") VALUES
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250001' AND c."Code" = 'CS101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'CS101' AND gc."Name" = 'Assignment 1 - Python Basics'),
 85.00, '2025-10-05',
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'Good work! Clean code structure.', NOW()
),
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250001' AND c."Code" = 'CS101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'CS101' AND gc."Name" = 'Midterm Exam'),
 78.50, '2025-11-18',
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'Good understanding of concepts, needs improvement on recursion.', NOW()
);

-- Mehmet Kaya - CS101 notlari (Assignment 1)
INSERT INTO "Grades" ("EnrollmentId", "GradeComponentId", "Score", "GradedAt", "GradedByFacultyId", "Comments", "CreatedAt") VALUES
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250003' AND c."Code" = 'CS101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'CS101' AND gc."Name" = 'Assignment 1 - Python Basics'),
 72.00, '2025-10-05',
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 'Acceptable work. Pay attention to variable naming conventions.', NOW()
);

-- Emma Wilson - ENG101 notlari (Essay 1 ve Participation)
INSERT INTO "Grades" ("EnrollmentId", "GradeComponentId", "Score", "GradedAt", "GradedByFacultyId", "Comments", "CreatedAt") VALUES
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250004' AND c."Code" = 'ENG101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'ENG101' AND gc."Name" = 'Essay 1 - Argumentative Writing'),
 92.00, '2025-10-15',
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000003'),
 'Excellent argumentation and well-structured essay. Outstanding work!', NOW()
),
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250004' AND c."Code" = 'ENG101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'ENG101' AND gc."Name" = 'Participation'),
 95.00, '2025-12-01',
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000003'),
 'Active participation throughout the semester.', NOW()
);

-- =============================================================================
-- 14. BLOG POSTS (Blog Yazilar)
-- =============================================================================
INSERT INTO "BlogPosts" ("Title", "Slug", "Content", "AuthorUserId", "PublishedAt", "IsPublished", "FeaturedImageUrl", "Excerpt", "Tags", "CreatedAt") VALUES
('Welcome to Global University of America - Fall 2025', 'test-welcome-fall-2025',
 'We are excited to welcome our new and returning students for the Fall 2025 semester! This promises to be an incredible year filled with learning opportunities, research breakthroughs, and community building.

Our campus has undergone significant improvements over the summer, including a state-of-the-art AI laboratory, renovated lecture halls, and expanded library resources. We have also welcomed several new faculty members who bring diverse expertise and fresh perspectives.

Key dates to remember:
- Orientation Week: September 8-12
- Classes Begin: September 15
- Midterm Exams: November 10-20
- Final Exams: January 10-20

We look forward to a productive and enriching semester together!',
 'd0000001-0000-0000-0000-000000000001',
 NOW() - INTERVAL '30 days', true, NULL,
 'We are excited to welcome our new and returning students for the Fall 2025 semester!',
 'welcome,fall-2025,announcement', NOW() - INTERVAL '30 days'),

('New AI Research Lab Opens at GUA', 'test-ai-research-lab-opens',
 'Global University of America is proud to announce the opening of its new Artificial Intelligence Research Laboratory. The lab features cutting-edge hardware including NVIDIA A100 GPUs, advanced robotics equipment, and collaborative workspaces.

The lab will be led by Professor Sarah Brown, who brings extensive industry experience from Google and Microsoft. Students enrolled in the Data Science and Computer Science programs will have access to the lab for their research projects.

"This lab represents our commitment to staying at the forefront of AI education and research," said Prof. Brown. "We are creating an environment where students can experiment, innovate, and push the boundaries of what is possible with artificial intelligence."

The lab is open to all graduate students and senior undergraduates by appointment.',
 'd0000001-0000-0000-0000-000000000001',
 NOW() - INTERVAL '15 days', true, NULL,
 'GUA opens its state-of-the-art AI Research Laboratory with NVIDIA A100 GPUs.',
 'ai,research,lab,technology', NOW() - INTERVAL '15 days'),

('Student Success: GUA Graduates Excel in Global Job Market', 'test-student-success-global-job-market',
 'Recent data shows that 94% of GUA graduates secure employment within 6 months of graduation. Our alumni are making their mark at leading companies including Google, Microsoft, Amazon, and top consulting firms worldwide.

The university''s career services team works closely with students from their first year, offering resume workshops, interview preparation, and networking events with industry leaders.

"GUA gave me the skills and confidence I needed to land my dream job," says Fatma Ozturk (Class of 2024, Computer Science). "The hands-on projects and internship opportunities were invaluable."

We invite all current students to take advantage of our career resources and build a strong foundation for their professional futures.',
 'd0000001-0000-0000-0000-000000000001',
 NOW() - INTERVAL '5 days', true, NULL,
 '94% of GUA graduates secure employment within 6 months of graduation.',
 'careers,graduates,success,employment', NOW() - INTERVAL '5 days'),

('Upcoming Workshop: Machine Learning with Python (Draft)', 'test-ml-workshop-draft',
 'Join us for an exciting workshop on Machine Learning with Python. This hands-on workshop will cover the fundamentals of ML, including supervised learning, unsupervised learning, and neural networks using scikit-learn and TensorFlow.',
 'd0000001-0000-0000-0000-000000000001',
 NULL, false, NULL,
 'Hands-on Machine Learning workshop coming soon.',
 'workshop,machine-learning,python', NOW());

-- =============================================================================
-- 15. GALLERY ITEMS (Galeri)
-- =============================================================================
INSERT INTO "GalleryItems" ("Title", "Description", "ImageUrl", "Category", "DisplayOrder", "IsActive", "CreatedAt") VALUES
('Test Campus Main Building', 'The historic main building of Global University of America', '/uploads/gallery/campus-main.jpg', 'Campus', 1, true, NOW()),
('Test Computer Science Lab', 'Students working in the state-of-the-art computer lab', '/uploads/gallery/cs-lab.jpg', 'Facilities', 2, true, NOW()),
('Test Graduation Ceremony 2024', 'Celebrating the achievements of the Class of 2024', '/uploads/gallery/graduation-2024.jpg', 'Events', 3, true, NOW()),
('Test Library Interior', 'The modern library with over 50,000 books and digital resources', '/uploads/gallery/library.jpg', 'Campus', 4, true, NOW()),
('Test Student Life', 'Students enjoying campus activities and social events', '/uploads/gallery/student-life.jpg', 'Students', 5, true, NOW()),
('Test International Day Festival', 'Annual International Day celebration with cultural performances', '/uploads/gallery/intl-day.jpg', 'Events', 6, true, NOW());

-- =============================================================================
-- 16. APPLICATIONS (Basvurular)
-- =============================================================================
INSERT INTO "Applications" ("ApplicantEmail", "ApplicantFirstName", "ApplicantLastName", "PhoneNumber", "ProgramId", "Status", "SubmittedAt", "ReviewedAt", "ReviewedByUserId", "Notes", "RejectionReason", "CreatedAt") VALUES
('john.doe@test.com', 'John', 'Doe', '+1-555-3001',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Computer Science' LIMIT 1),
 2, NOW() - INTERVAL '10 days', NULL, NULL,
 'Strong candidate with programming background.', NULL, NOW() - INTERVAL '10 days'),

('maria.garcia@test.com', 'Maria', 'Garcia', '+1-555-3002',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'MBA' LIMIT 1),
 4, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days',
 'd0000001-0000-0000-0000-000000000001',
 'Excellent qualifications. 5 years management experience.', NULL, NOW() - INTERVAL '20 days'),

('ahmed.hassan@test.com', 'Ahmed', 'Hassan', '+90-555-3003',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Data Science' LIMIT 1),
 5, NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days',
 'd0000001-0000-0000-0000-000000000001',
 NULL, 'Does not meet minimum GPA requirement of 3.0.', NOW() - INTERVAL '25 days'),

('sophie.martin@test.com', 'Sophie', 'Martin', '+33-555-3004',
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'English Language & Literature' LIMIT 1),
 3, NOW() - INTERVAL '5 days', NULL, NULL,
 'Reviewing English proficiency test results.', NULL, NOW() - INTERVAL '5 days'),

('draft.applicant@test.com', 'Draft', 'Applicant', NULL,
 (SELECT "Id" FROM "Programs" WHERE "Name" = 'Business Administration' LIMIT 1),
 1, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days');

-- =============================================================================
-- 17. COURSE MATERIALS (Ders Materyalleri)
-- =============================================================================
INSERT INTO "CourseMaterials" ("CourseId", "CourseOfferingId", "Title", "Description", "FileUrl", "FileType", "Version", "UploadedByFacultyId", "IsActive", "CreatedAt") VALUES
((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'CS101 - Course Syllabus Fall 2025', 'Complete course syllabus with weekly topics and grading policy.',
 '/uploads/materials/cs101-syllabus.pdf', 'PDF', 1,
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Week 1 - Introduction to Python', 'Lecture slides covering Python basics, variables, and operators.',
 '/uploads/materials/cs101-week1.pptx', 'PowerPoint', 1,
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'CS101'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'CS101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'Week 2 - Control Flow & Functions', 'Lecture slides on if/else, loops, and function definitions.',
 '/uploads/materials/cs101-week2.pptx', 'PowerPoint', 2,
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000001'),
 true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'BA101'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'BA101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'BA101 - Course Handbook', 'Complete course handbook with case study guidelines.',
 '/uploads/materials/ba101-handbook.pdf', 'PDF', 1,
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000002'),
 true, NOW()),

((SELECT "Id" FROM "Courses" WHERE "Code" = 'ENG101'),
 (SELECT co."Id" FROM "CourseOfferings" co JOIN "Courses" c ON co."CourseId" = c."Id" WHERE c."Code" = 'ENG101' AND co."TermId" = (SELECT "Id" FROM "AcademicTerms" WHERE "Code" = '2025-FALL')),
 'ENG101 - Writing Guide', 'Academic writing style guide and APA formatting reference.',
 '/uploads/materials/eng101-writing-guide.pdf', 'PDF', 1,
 (SELECT "Id" FROM "FacultyProfiles" WHERE "UserId" = 'a0000001-0000-0000-0000-000000000003'),
 true, NOW());

-- =============================================================================
-- 18. ASSIGNMENT SUBMISSIONS (Odev Teslimleri)
-- =============================================================================
-- Ali Yilmaz - CS101 Assignment 1 teslim etti
INSERT INTO "AssignmentSubmissions" ("EnrollmentId", "GradeComponentId", "SubmittedAt", "FileUrl", "FileName", "FileSize", "StudentComments", "Status", "CreatedAt") VALUES
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250001' AND c."Code" = 'CS101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'CS101' AND gc."Name" = 'Assignment 1 - Python Basics'),
 '2025-09-28', '/uploads/assignments/ali-cs101-hw1.py', 'ali-cs101-hw1.py', 15420,
 'Here is my assignment. I implemented all required functions.', 2, NOW()
);

-- Mehmet Kaya - CS101 Assignment 1 teslim etti
INSERT INTO "AssignmentSubmissions" ("EnrollmentId", "GradeComponentId", "SubmittedAt", "FileUrl", "FileName", "FileSize", "StudentComments", "Status", "CreatedAt") VALUES
(
 (SELECT e."Id" FROM "Enrollments" e
  JOIN "StudentProfiles" sp ON e."StudentId" = sp."Id"
  JOIN "CourseOfferings" co ON e."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE sp."StudentNumber" = 'GUA-20250003' AND c."Code" = 'CS101'),
 (SELECT gc."Id" FROM "GradeComponents" gc
  JOIN "CourseOfferings" co ON gc."CourseOfferingId" = co."Id"
  JOIN "Courses" c ON co."CourseId" = c."Id"
  WHERE c."Code" = 'CS101' AND gc."Name" = 'Assignment 1 - Python Basics'),
 '2025-10-02', '/uploads/assignments/mehmet-cs101-hw1.zip', 'mehmet-cs101-hw1.zip', 28560,
 'Submitted late due to technical issues.', 3, NOW()
);

-- =============================================================================
-- DOGRULAMA SORGULARI
-- =============================================================================
DO $$
DECLARE
  v_departments INT; v_programs INT; v_courses INT; v_terms INT;
  v_users INT; v_faculty INT; v_students INT;
  v_offerings INT; v_enrollments INT; v_grades INT;
  v_blogs INT; v_gallery INT; v_apps INT;
BEGIN
  SELECT COUNT(*) INTO v_departments FROM "Departments";
  SELECT COUNT(*) INTO v_programs FROM "Programs";
  SELECT COUNT(*) INTO v_courses FROM "Courses";
  SELECT COUNT(*) INTO v_terms FROM "AcademicTerms";
  SELECT COUNT(*) INTO v_users FROM "Users";
  SELECT COUNT(*) INTO v_faculty FROM "FacultyProfiles";
  SELECT COUNT(*) INTO v_students FROM "StudentProfiles";
  SELECT COUNT(*) INTO v_offerings FROM "CourseOfferings";
  SELECT COUNT(*) INTO v_enrollments FROM "Enrollments";
  SELECT COUNT(*) INTO v_grades FROM "Grades";
  SELECT COUNT(*) INTO v_blogs FROM "BlogPosts";
  SELECT COUNT(*) INTO v_gallery FROM "GalleryItems";
  SELECT COUNT(*) INTO v_apps FROM "Applications";

  RAISE NOTICE '';
  RAISE NOTICE '=============================================';
  RAISE NOTICE '  GUA TEST VERISI BASARIYLA YUKLENDI!';
  RAISE NOTICE '=============================================';
  RAISE NOTICE '  Departments:     %', v_departments;
  RAISE NOTICE '  Programs:        %', v_programs;
  RAISE NOTICE '  Courses:         %', v_courses;
  RAISE NOTICE '  Academic Terms:  %', v_terms;
  RAISE NOTICE '  Users:           %', v_users;
  RAISE NOTICE '  Faculty:         %', v_faculty;
  RAISE NOTICE '  Students:        %', v_students;
  RAISE NOTICE '  Course Offerings:%', v_offerings;
  RAISE NOTICE '  Enrollments:     %', v_enrollments;
  RAISE NOTICE '  Grades:          %', v_grades;
  RAISE NOTICE '  Blog Posts:      %', v_blogs;
  RAISE NOTICE '  Gallery Items:   %', v_gallery;
  RAISE NOTICE '  Applications:    %', v_apps;
  RAISE NOTICE '=============================================';
  RAISE NOTICE '';
  RAISE NOTICE '  GIRIS BILGILERI:';
  RAISE NOTICE '  Admin:   admin@gua.edu.pl / Test1234!';
  RAISE NOTICE '  Admin2:  admin2@test.gua.edu / Test1234!';
  RAISE NOTICE '  Faculty: prof.smith@test.gua.edu / Test1234!';
  RAISE NOTICE '  Student: ali.yilmaz@test.gua.edu / Test1234!';
  RAISE NOTICE '  (Tum test kullanicilari: Test1234!)';
  RAISE NOTICE '=============================================';
END $$;
