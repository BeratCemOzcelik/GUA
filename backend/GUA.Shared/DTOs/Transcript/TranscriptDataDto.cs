namespace GUA.Shared.DTOs.Transcript;

public class TranscriptDataDto
{
    public StudentInfo Student { get; set; } = new();
    public List<TermRecord> TermRecords { get; set; } = new();
    public GPASummary GPASummary { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class StudentInfo
{
    public string StudentNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public DateTime? ExpectedGraduationDate { get; set; }
    public string AcademicStatus { get; set; } = string.Empty;
}

public class TermRecord
{
    public string TermName { get; set; } = string.Empty;
    public string TermCode { get; set; } = string.Empty;
    public List<CourseRecord> Courses { get; set; } = new();
    public decimal TermGPA { get; set; }
    public int TermCredits { get; set; }
    public decimal CumulativeGPA { get; set; }
    public int CumulativeCredits { get; set; }
}

public class CourseRecord
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public decimal GradePoints { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class GPASummary
{
    public decimal CurrentGPA { get; set; }
    public int TotalCreditsEarned { get; set; }
    public int TotalCreditsAttempted { get; set; }
    public decimal OverallGPA { get; set; }
}

public class DiplomaVerificationResult
{
    public bool IsValid { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal GPA { get; set; }
    public int TotalCreditsEarned { get; set; }
    public DateTime GeneratedAt { get; set; }
    public bool IsOfficial { get; set; }
    public string VerificationCode { get; set; } = string.Empty;
}
