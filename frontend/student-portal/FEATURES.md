# Student Portal Features Documentation

## Overview
The GUA Student Portal is a comprehensive web application that allows students to manage their academic life, including course enrollment, grade tracking, and profile management.

## Feature List

### 1. Authentication & Authorization

#### Login System
- Email and password authentication
- Role-based access control (Students only)
- JWT token management
- Automatic token refresh
- Secure session handling
- Logout functionality

**Pages:**
- `/auth/login` - Student login page

**Features:**
- Form validation
- Error handling
- Loading states
- Automatic redirect after login
- Remember me (via token storage)

---

### 2. Dashboard

#### Overview Display
- Welcome message with student name
- Student number and program display
- Current academic standing

#### Key Metrics
- **Current GPA** - Large, prominent display
- **Total Credits Earned** - Cumulative credits
- **Courses in Progress** - Active enrollment count
- **Expected Graduation** - Year display

#### Current Enrollments
- Card-based course display
- Quick access to grades
- Enrollment status badges
- Course details at a glance

#### Quick Links
- Browse Courses
- View Grades
- View Transcript

**Page:** `/dashboard`

**API Calls:**
- `GET /api/studentprofiles/me`
- `GET /api/enrollments/my-enrollments?status=Enrolled`

---

### 3. Course Enrollment

#### Browse Available Courses
- List all courses available for enrollment
- Filter by academic term
- Filter by department
- Real-time availability status
- Capacity indicators

#### Course Information Display
- Course code and name
- Credits
- Section number
- Faculty name
- Schedule (days/times)
- Location (room/building)
- Enrolled count / Capacity
- Prerequisites (if any)

#### Enrollment Process
- One-click enrollment
- Prerequisite validation
- Capacity checking
- Enrollment confirmation
- Error handling for failed enrollments

**Page:** `/courses`

**API Calls:**
- `GET /api/enrollments/available?termId=X&departmentId=Y`
- `POST /api/enrollments`
- `GET /api/academicterms`
- `GET /api/departments`

**Validation:**
- Prerequisites met (backend)
- Course not full
- Not already enrolled
- No schedule conflicts (backend)

---

### 4. My Courses

#### Course Management
- View all enrolled courses
- Filter by academic term
- Filter by status (Enrolled, Completed, Dropped)
- Sort by term

#### Course Actions
- **Drop Course** - Remove enrollment (with confirmation)
- **View Grades** - Navigate to grade details
- Status display (Enrolled, Completed, Dropped)
- Final grade display (for completed courses)

#### Information Display
- All course details
- Enrollment date
- Current status
- Final grade (if completed)

**Page:** `/my-courses`

**API Calls:**
- `GET /api/enrollments/my-enrollments?termId=X&status=Y`
- `POST /api/enrollments/{id}/drop`
- `GET /api/academicterms`

**Features:**
- Drop confirmation dialog
- Status badges with color coding
- Grade display with color coding
- Empty state when no courses

---

### 5. Grades System

#### Grades Overview Page
- List all courses with grades
- Filter by academic term
- Table view with key information

#### Information Displayed
- Course code and name
- Academic term
- Credits
- Weighted average (if components graded)
- Final letter grade (if published)
- Enrollment status
- Link to detailed view

#### Grade Color Coding
- **A (Green)** - 90-100%
- **B (Blue)** - 80-89%
- **C (Amber)** - 70-79%
- **D (Orange)** - 60-69%
- **F (Red)** - 0-59%

**Page:** `/grades`

**API Calls:**
- `GET /api/grades/my-grades?termId=X`
- `GET /api/academicterms`

---

### 6. Detailed Grade View

#### Grade Components Table
- Component name (Assignment 1, Midterm, Final, etc.)
- Weight percentage
- Earned score
- Maximum score
- Percentage score
- Publication status

#### Grade Calculations
- Weighted average calculation
- Final letter grade assignment
- Grade point display
- Visual grade scale

#### Additional Information
- Course details header
- Enrollment status
- Faculty information
- Grading scale reference
- Calculation methodology

**Page:** `/grades/[enrollmentId]`

**API Calls:**
- `GET /api/enrollments/{id}`
- `GET /api/grades/enrollment/{id}`

**Features:**
- Only published grades shown
- Automatic weighted average calculation
- Color-coded performance indicators
- Grade point conversion table
- Back navigation

---

### 7. Academic Transcript

#### Transcript Display
- Student information header
- Organized by academic term
- Cumulative statistics

#### Student Information
- Full name
- Student number
- Program
- Enrollment date

#### Cumulative Statistics
- **Cumulative GPA** - Overall grade point average
- **Credits Earned** - Successfully completed credits
- **Credits Attempted** - Total credits attempted

#### Term-by-Term Records
For each term:
- Term name and dates
- List of courses taken
- Course code, name, credits
- Final grade and grade point
- Term GPA
- Term credits (earned/attempted)

#### Transcript Actions
- **Generate Transcript** - Create official snapshot
- **View History** - See past generated transcripts

**Page:** `/transcript`

**API Calls:**
- `GET /api/transcripts/my-transcript`
- `POST /api/transcripts/generate`

**Features:**
- Print-friendly layout
- Official formatting
- Grading scale legend
- Chronological organization
- Color-coded grades

---

### 8. Student Profile

#### View Profile Information
Read-only fields:
- Student number
- Email
- First name
- Last name
- Date of birth
- Program
- Enrollment date
- Expected graduation date

Editable fields:
- Address
- City
- Country
- Phone number

#### Academic Summary
- Current GPA (large display)
- Total credits earned
- Visual stat cards

#### Security
- **Change Password** functionality
- Current password verification
- New password confirmation
- Password strength requirements

**Page:** `/profile`

**API Calls:**
- `GET /api/studentprofiles/me`
- `PUT /api/studentprofiles/me`
- `POST /api/studentprofiles/me/change-password`

**Features:**
- Edit mode toggle
- Form validation
- Save/cancel actions
- Password change form
- Success/error feedback

---

## Shared Components

### Sidebar Navigation
- Logo and branding
- Navigation menu items
- Active route highlighting
- User profile section
- Logout button

**Navigation Items:**
- Dashboard
- Courses
- My Courses
- Grades
- Transcript
- Profile

### Header
- Breadcrumb navigation
- Page context
- Welcome message
- User avatar

### Course Card
- Reusable course display
- Customizable action buttons
- Prerequisites display
- Capacity indicators
- Consistent styling

### Stat Card
- Dashboard statistics display
- Icon support
- Color themes
- Responsive layout

### Grade Table
- Grade components display
- Published grades only
- Weighted average calculation
- Color-coded scores
- Responsive table layout

---

## User Experience Features

### Loading States
- Spinner animations
- Skeleton loaders
- Disabled buttons during operations
- Loading text feedback

### Error Handling
- User-friendly error messages
- Form validation feedback
- API error display
- Retry options

### Empty States
- Helpful messages when no data
- Call-to-action buttons
- Guidance for next steps
- Links to relevant pages

### Confirmation Dialogs
- Drop course confirmation
- Transcript generation confirmation
- Destructive action warnings
- Cancel options

### Responsive Design
- Mobile-first approach
- Tablet optimizations
- Desktop enhancements
- Touch-friendly interfaces

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## Security Features

### Authentication
- JWT token-based auth
- Role verification (Student only)
- Automatic token refresh
- Secure token storage

### Authorization
- Protected routes
- Role-based access control
- API request authentication
- Session management

### Data Privacy
- Student data protection
- Secure API communications
- HTTPS enforcement (production)
- XSS protection

---

## Performance Optimizations

### Code Splitting
- Route-based code splitting
- Dynamic imports
- Lazy loading

### Caching
- API response caching
- Static asset caching
- Browser caching strategies

### Optimizations
- Image optimization
- CSS optimization
- JavaScript minification
- Gzip compression

---

## Future Enhancements (Phase 4+)

### Planned Features
1. **Student Communications**
   - Messaging system
   - Notifications
   - Announcements

2. **Course Materials Access**
   - Download course materials
   - View syllabi
   - Access resources

3. **Advanced Transcript**
   - PDF generation
   - Email delivery
   - Digital signatures

4. **Payment Integration**
   - View tuition fees
   - Payment history
   - Online payments

5. **Advanced Analytics**
   - Performance trends
   - Progress tracking
   - Graduation planning

6. **Mobile App**
   - Native iOS app
   - Native Android app
   - Progressive Web App

---

## Support & Help

### Student Support
- Help documentation
- FAQ section
- Contact information
- Support tickets

### Technical Support
- Browser compatibility
- System requirements
- Troubleshooting guide
- Known issues

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Standards

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast standards
- Focus indicators

---

This documentation covers the complete feature set of the Student Portal Phase 3 implementation.
