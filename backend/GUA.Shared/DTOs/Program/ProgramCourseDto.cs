namespace GUA.Shared.DTOs.Program;

public class ProgramCourseDto
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int CourseCredits { get; set; }
    public string? CourseDescription { get; set; }
    public int YearLevel { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
}

public class AddProgramCourseRequest
{
    public int CourseId { get; set; }
    public int YearLevel { get; set; } = 1;
    public bool IsRequired { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

public class UpdateProgramCourseRequest
{
    public int YearLevel { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
}

public class BulkAddProgramCoursesRequest
{
    public List<AddProgramCourseRequest> Courses { get; set; } = new();
}

public class CurriculumYearDto
{
    public int YearLevel { get; set; }
    public List<ProgramCourseDto> Courses { get; set; } = new();
    public int TotalCredits { get; set; }
}

public class CurriculumDto
{
    public int ProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public int DurationYears { get; set; }
    public int TotalCreditsRequired { get; set; }
    public int AssignedCredits { get; set; }
    public List<CurriculumYearDto> Years { get; set; } = new();
}
