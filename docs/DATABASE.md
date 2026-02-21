# Database Schema Documentation

## Overview

Database: PostgreSQL 16
ORM: Entity Framework Core 8

## Entity Relationship Diagram

```
User ──< UserRole >── Role
  │
  ├──< StudentProfile ──< Enrollment ──< Grade
  │                         │
  │                         └──< FinalGrade
  ├──< FacultyProfile ──< CourseOffering ──< Enrollment
  │                         │
  │                         └──< CourseMaterial
  └──< AuditLog

Department ──< Program ──< StudentProfile
    │            │
    └──< Course <┘
         │
         └──< CoursePrerequisite
         │
         └──< CourseOffering

AcademicTerm ──< CourseOffering
              └──< GPARecord

Application ──< ApplicationDocument
```

## Core Tables

### Users & Authentication

**User**
- `Id` (Guid, PK)
- `Email` (string, unique)
- `PasswordHash` (string)
- `FirstName` (string)
- `LastName` (string)
- `IsActive` (bool)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)

**Role**
- `Id` (int, PK)
- `Name` (string) - Values: Student, Faculty, Admin, SuperAdmin

**UserRole** (Junction table)
- `UserId` (Guid, FK)
- `RoleId` (int, FK)

### Academic Domain

**Department**
- `Id` (int, PK)
- `Name` (string)
- `Code` (string, unique)
- `Description` (string)
- `IsActive` (bool)
- `CreatedAt` (DateTime)

**Program**
- `Id` (int, PK)
- `DepartmentId` (int, FK)
- `Name` (string)
- `DegreeType` (enum: Bachelor, Master, Doctoral)
- `TotalCreditsRequired` (int)
- `DurationYears` (int)
- `Description` (string)
- `IsActive` (bool)

**Course**
- `Id` (int, PK)
- `DepartmentId` (int, FK)
- `Code` (string, unique)
- `Name` (string)
- `Credits` (int)
- `Description` (string)
- `Syllabus` (string)
- `IsActive` (bool)

**CoursePrerequisite**
- `CourseId` (int, FK)
- `PrerequisiteCourseId` (int, FK)

**AcademicTerm**
- `Id` (int, PK)
- `Name` (string) - e.g., "Fall 2024"
- `Code` (string, unique) - e.g., "2024-FALL"
- `StartDate` (DateTime)
- `EndDate` (DateTime)
- `IsActive` (bool)
- `EnrollmentStartDate` (DateTime)
- `EnrollmentEndDate` (DateTime)

### Student Records

**StudentProfile**
- `Id` (int, PK)
- `UserId` (Guid, FK, unique)
- `StudentNumber` (string, unique)
- `ProgramId` (int, FK)
- `EnrollmentDate` (DateTime)
- `ExpectedGraduationDate` (DateTime)
- `CurrentGPA` (decimal)
- `TotalCreditsEarned` (int)
- `AcademicStatus` (enum: Active, Suspended, Graduated, Withdrawn)

**Enrollment**
- `Id` (int, PK)
- `StudentId` (int, FK)
- `CourseOfferingId` (int, FK)
- `EnrollmentDate` (DateTime)
- `Status` (enum: Enrolled, Dropped, Completed)
- `DropDate` (DateTime, nullable)
- `CompletionDate` (DateTime, nullable)

**Grade**
- `Id` (int, PK)
- `EnrollmentId` (int, FK)
- `GradeComponentId` (int, FK)
- `Score` (decimal)
- `GradedAt` (DateTime)
- `GradedByFacultyId` (int, FK)
- `Comments` (string)

**FinalGrade**
- `Id` (int, PK)
- `EnrollmentId` (int, FK, unique)
- `LetterGrade` (string) - A, B+, B, C, etc.
- `NumericGrade` (decimal)
- `GradePoints` (decimal)
- `PublishedAt` (DateTime)
- `PublishedByFacultyId` (int, FK)

### Indexes

Key indexes for performance:
- `User.Email` (unique)
- `StudentProfile.StudentNumber` (unique)
- `Course.Code` (unique)
- `Enrollment.StudentId, CourseOfferingId` (composite)
- `AuditLog.UserId, Timestamp`

## Constraints

- Email must be unique and valid format
- Student number auto-generated (format: GUA-YYYYNNNN)
- GPA must be between 0.0 and 4.0
- Credits must be positive integers
- Enrollment dates must be within term dates

## Audit Trail

All CUD operations logged in `AuditLog` table with:
- User ID
- Action (Create/Update/Delete)
- Entity name and ID
- Old/new values (JSON)
- Timestamp and IP address
