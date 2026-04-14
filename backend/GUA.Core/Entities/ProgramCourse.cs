namespace GUA.Core.Entities;

public class ProgramCourse : BaseEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public int CourseId { get; set; }

    /// <summary>
    /// Recommended year level (1-4 for BA/BS). Used for curriculum display grouping.
    /// Self-paced model: students may take courses in any order.
    /// </summary>
    public int YearLevel { get; set; } = 1;

    /// <summary>
    /// Required courses must be completed for graduation. Electives are optional.
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Ordering within a year for display.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    public virtual Program Program { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
}
