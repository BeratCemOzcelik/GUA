using GUA.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace GUA.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Identity
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }

    // Academic
    public DbSet<Department> Departments { get; set; }
    public DbSet<Program> Programs { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CoursePrerequisite> CoursePrerequisites { get; set; }
    public DbSet<AcademicTerm> AcademicTerms { get; set; }
    public DbSet<CourseOffering> CourseOfferings { get; set; }

    // Student Records
    public DbSet<StudentProfile> StudentProfiles { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<GradeComponent> GradeComponents { get; set; }
    public DbSet<Grade> Grades { get; set; }
    public DbSet<FinalGrade> FinalGrades { get; set; }
    public DbSet<GPARecord> GPARecords { get; set; }
    public DbSet<Transcript> Transcripts { get; set; }
    public DbSet<AssignmentSubmission> AssignmentSubmissions { get; set; }

    // Faculty
    public DbSet<FacultyProfile> FacultyProfiles { get; set; }
    public DbSet<CourseMaterial> CourseMaterials { get; set; }

    // Content
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<GalleryItem> GalleryItems { get; set; }

    // Admissions
    public DbSet<Application> Applications { get; set; }
    public DbSet<ApplicationDocument> ApplicationDocuments { get; set; }

    // Payments
    public DbSet<Payment> Payments { get; set; }

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        // Role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);

            // Seed default roles
            entity.HasData(
                new Role { Id = 1, Name = "SuperAdmin", Description = "Full system access" },
                new Role { Id = 2, Name = "Admin", Description = "Administrative access" },
                new Role { Id = 3, Name = "Faculty", Description = "Faculty member access" },
                new Role { Id = 4, Name = "Student", Description = "Student access" }
            );
        });

        // UserRole (many-to-many junction)
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Department
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
        });

        // Program
        modelBuilder.Entity<Program>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(300);
            entity.HasOne(e => e.Department)
                .WithMany(d => d.Programs)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Course
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(300);
            entity.HasOne(e => e.Department)
                .WithMany(d => d.Courses)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CoursePrerequisite
        modelBuilder.Entity<CoursePrerequisite>(entity =>
        {
            entity.HasKey(e => new { e.CourseId, e.PrerequisiteCourseId });
            entity.HasOne(e => e.Course)
                .WithMany(c => c.PrerequisiteCourses)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PrerequisiteCourse)
                .WithMany(c => c.DependentCourses)
                .HasForeignKey(e => e.PrerequisiteCourseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AcademicTerm
        modelBuilder.Entity<AcademicTerm>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
        });

        // CourseOffering
        modelBuilder.Entity<CourseOffering>(entity =>
        {
            entity.HasOne(e => e.Course)
                .WithMany(c => c.CourseOfferings)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Term)
                .WithMany(t => t.CourseOfferings)
                .HasForeignKey(e => e.TermId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Faculty)
                .WithMany(f => f.CourseOfferings)
                .HasForeignKey(e => e.FacultyProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // StudentProfile
        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.StudentNumber).IsUnique();
            entity.Property(e => e.StudentNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CurrentGPA).HasPrecision(3, 2);
            entity.HasOne(e => e.User)
                .WithOne(u => u.StudentProfile)
                .HasForeignKey<StudentProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Program)
                .WithMany(p => p.StudentProfiles)
                .HasForeignKey(e => e.ProgramId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // FacultyProfile
        modelBuilder.Entity<FacultyProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne(u => u.FacultyProfile)
                .HasForeignKey<FacultyProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Enrollment
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.StudentId, e.CourseOfferingId }).IsUnique();
            entity.HasOne(e => e.Student)
                .WithMany(s => s.Enrollments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CourseOffering)
                .WithMany(co => co.Enrollments)
                .HasForeignKey(e => e.CourseOfferingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GradeComponent
        modelBuilder.Entity<GradeComponent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Weight).HasPrecision(5, 2);
            entity.Property(e => e.MaxScore).HasPrecision(5, 2);
            entity.HasOne(e => e.CourseOffering)
                .WithMany(co => co.GradeComponents)
                .HasForeignKey(e => e.CourseOfferingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Grade
        modelBuilder.Entity<Grade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Score).HasPrecision(5, 2);
            entity.HasOne(e => e.Enrollment)
                .WithMany(en => en.Grades)
                .HasForeignKey(e => e.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.GradeComponent)
                .WithMany(gc => gc.Grades)
                .HasForeignKey(e => e.GradeComponentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.GradedByFaculty)
                .WithMany(f => f.GradedGrades)
                .HasForeignKey(e => e.GradedByFacultyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // FinalGrade
        modelBuilder.Entity<FinalGrade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EnrollmentId).IsUnique();
            entity.Property(e => e.LetterGrade).IsRequired().HasMaxLength(5);
            entity.Property(e => e.NumericGrade).HasPrecision(5, 2);
            entity.Property(e => e.GradePoints).HasPrecision(3, 2);
            entity.HasOne(e => e.Enrollment)
                .WithOne(en => en.FinalGrade)
                .HasForeignKey<FinalGrade>(e => e.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PublishedByFaculty)
                .WithMany(f => f.PublishedFinalGrades)
                .HasForeignKey(e => e.PublishedByFacultyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GPARecord
        modelBuilder.Entity<GPARecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.StudentId, e.TermId }).IsUnique();
            entity.Property(e => e.TermGPA).HasPrecision(3, 2);
            entity.Property(e => e.CumulativeGPA).HasPrecision(3, 2);
            entity.HasOne(e => e.Student)
                .WithMany(s => s.GPARecords)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Term)
                .WithMany(t => t.GPARecords)
                .HasForeignKey(e => e.TermId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Transcript
        modelBuilder.Entity<Transcript>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Student)
                .WithMany(s => s.Transcripts)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.GeneratedBy)
                .WithMany()
                .HasForeignKey(e => e.GeneratedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CourseMaterial
        modelBuilder.Entity<CourseMaterial>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.HasOne(e => e.Course)
                .WithMany(c => c.CourseMaterials)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CourseOffering)
                .WithMany(co => co.CourseMaterials)
                .HasForeignKey(e => e.CourseOfferingId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.UploadedBy)
                .WithMany()
                .HasForeignKey(e => e.UploadedByFacultyId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BlogPost
        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // GalleryItem
        modelBuilder.Entity<GalleryItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
        });

        // Application
        modelBuilder.Entity<Application>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ApplicantEmail).IsRequired().HasMaxLength(256);
            entity.Property(e => e.ApplicantFirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ApplicantLastName).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Program)
                .WithMany(p => p.Applications)
                .HasForeignKey(e => e.ProgramId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReviewedBy)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ApplicationDocument
        modelBuilder.Entity<ApplicationDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Application)
                .WithMany(a => a.Documents)
                .HasForeignKey(e => e.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Timestamp });
            entity.HasIndex(e => e.Timestamp);
            entity.HasOne(e => e.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AssignmentSubmission
        modelBuilder.Entity<AssignmentSubmission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.EnrollmentId, e.GradeComponentId }).IsUnique();
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.FileUrl).IsRequired();
            entity.HasOne(e => e.Enrollment)
                .WithMany(en => en.AssignmentSubmissions)
                .HasForeignKey(e => e.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.GradeComponent)
                .WithMany(gc => gc.AssignmentSubmissions)
                .HasForeignKey(e => e.GradeComponentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Currency).IsRequired().HasMaxLength(3);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
