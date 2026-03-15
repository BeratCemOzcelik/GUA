namespace GUA.Shared.Enums;

public enum SubmissionStatus
{
    Pending = 0,      // Not yet submitted
    Submitted = 1,    // Submitted, awaiting grade
    Graded = 2,       // Graded by faculty
    Late = 3          // Submitted after due date
}
