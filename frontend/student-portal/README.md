# GUA Student Portal

Next.js 14 frontend application for the Global University America Student Portal.

## Features

### Authentication
- Student login with role verification
- JWT-based authentication with token refresh
- Protected routes requiring student role

### Dashboard
- Welcome message with student information
- Current GPA display (prominent)
- Current term enrollments
- Quick stats (credits earned, courses in progress)
- Quick links to key features

### Course Enrollment
- Browse available courses for current/selected term
- Filter by department and academic term
- View course details (code, name, credits, section, faculty, schedule, location)
- See capacity and available seats
- View prerequisites
- Enroll in courses (with validation)
- Automatic prerequisite checking

### My Courses
- View all enrolled courses (current and past)
- Filter by term and status
- Drop courses (with confirmation)
- View enrollment status
- See final grades for completed courses
- Quick access to grade details

### Grades
- View all courses with grades
- Filter by academic term
- See grade components (assignments, exams, etc.)
- View weighted averages
- See final letter grades
- Color-coded grade display
- Detailed grade breakdown per course

### Transcript
- Official transcript view organized by term
- Course history with grades and credits
- Term GPA and cumulative GPA
- Credits earned and attempted
- Generate official transcript snapshots
- View transcript history
- Grading scale reference

### Profile
- View student profile information
- Edit personal information (address, city, country, phone)
- Change password
- View academic summary (GPA, credits)
- View student number, program, enrollment date

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:5000/api

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The app will run on http://localhost:3002

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
student-portal/
├── app/                      # Next.js App Router pages
│   ├── auth/                 # Authentication pages
│   │   └── login/           # Student login
│   ├── dashboard/           # Dashboard page
│   ├── courses/             # Course enrollment
│   ├── my-courses/          # Student's enrolled courses
│   ├── grades/              # Grades overview
│   │   └── [enrollmentId]/ # Detailed grades
│   ├── transcript/          # Academic transcript
│   ├── profile/             # Student profile
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with auth
│   └── page.tsx             # Home page (redirects)
├── components/              # Reusable components
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── Header.tsx           # Top header bar
│   ├── CourseCard.tsx       # Course display card
│   ├── StatCard.tsx         # Dashboard stat cards
│   └── GradeTable.tsx       # Grade components table
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                     # Utility libraries
│   ├── api.ts               # API client with endpoints
│   └── types.ts             # TypeScript types
└── public/                  # Static assets
```

## Key Features Implementation

### Authentication Flow
1. User logs in with email/password
2. Backend validates credentials and returns JWT tokens
3. Frontend verifies user has "Student" role
4. User redirected to dashboard
5. All API requests include JWT token
6. Automatic token refresh on expiry

### Course Enrollment Flow
1. Student browses available courses
2. System checks prerequisites and capacity
3. Student clicks "Enroll"
4. Backend validates prerequisites and enrollment rules
5. Enrollment created, capacity updated
6. Student can view course in "My Courses"

### Grade Viewing Flow
1. Faculty publishes grade components
2. Student views published grades only
3. Weighted average calculated automatically
4. Final letter grade assigned when all components graded
5. Detailed breakdown available per course

### Transcript Generation
1. Student views current transcript data
2. Click "Generate Transcript" creates snapshot
3. Transcript timestamped and stored
4. Historical transcripts accessible
5. Official format with term-by-term breakdown

## API Endpoints Used

- `POST /api/auth/login` - Student login
- `GET /api/studentprofiles/me` - Get student profile
- `PUT /api/studentprofiles/me` - Update profile
- `GET /api/enrollments/available` - Get available courses
- `GET /api/enrollments/my-enrollments` - Get student enrollments
- `POST /api/enrollments` - Enroll in course
- `POST /api/enrollments/:id/drop` - Drop course
- `GET /api/grades/my-grades` - Get student grades
- `GET /api/grades/enrollment/:id` - Get enrollment grades
- `GET /api/transcripts/my-transcript` - Get transcript
- `POST /api/transcripts/generate` - Generate transcript

## Color Theme

Primary Color: Maroon (#8B1A1A)
- Primary Dark: #6B1414
- Primary Light: #A52A2A

Accent Colors:
- Gold: #D4AF37
- Navy: #1E3A8A

## User Experience

### Loading States
- Spinner animations during API calls
- Disabled buttons during operations
- Loading skeletons for better UX

### Error Handling
- User-friendly error messages
- Form validation feedback
- API error display

### Empty States
- Helpful messages when no data
- Links to relevant actions
- Guidance for next steps

### Confirmation Dialogs
- Drop course confirmation
- Transcript generation confirmation
- Password change confirmation

### Responsive Design
- Mobile-friendly layouts
- Responsive grid systems
- Touch-friendly buttons

## Testing Credentials

Students need to be created in the backend with the "Student" role.
Contact your system administrator for student account creation.

Example student login:
```
Email: student@gua.edu.pl
Password: Student123!
```

## Deployment

For production deployment:

1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

3. Start the production server:
```bash
npm start
```

Or deploy to platforms like Vercel, Netlify, or AWS.

## License

Copyright © 2026 Global University America. All rights reserved.
