# Student Portal - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ npm or yarn
- ✅ Backend API running on http://localhost:5000

---

## Step 1: Navigate to Project

```bash
cd C:/Users/berat/OneDrive/Desktop/Global_University_America/frontend/student-portal
```

---

## Step 2: Install Dependencies (Already Done!)

Dependencies have already been installed. If you need to reinstall:

```bash
npm install
```

---

## Step 3: Check Environment Configuration

Verify `.env.local` file exists with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

The application will start on **http://localhost:3002**

---

## Step 5: Access the Portal

Open your browser and navigate to:
```
http://localhost:3002
```

You'll be redirected to the login page.

---

## Step 6: Login as a Student

Use student credentials (must be created in backend):

```
Email: student@gua.edu.pl
Password: [student password]
```

**Note:** Student accounts must have the "Student" role assigned in the backend.

---

## 🎯 What You Can Do

Once logged in, you can:

### 📊 Dashboard
- View your current GPA
- See enrolled courses
- Check academic stats
- Quick access to features

### 📚 Browse Courses
- Filter by term and department
- View course details
- Enroll in courses
- Check prerequisites

### 📖 My Courses
- View all enrollments
- Drop courses
- Check enrollment status
- Access grades

### 📝 Grades
- View all course grades
- See grade components
- Check weighted averages
- View final letter grades

### 📜 Transcript
- View academic record
- See cumulative GPA
- Check credits earned
- Generate official transcript

### 👤 Profile
- Edit personal information
- Change password
- View academic summary

---

## 🛠️ Development Commands

### Run Development Server
```bash
npm run dev
```
App runs on http://localhost:3002

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Linter
```bash
npm run lint
```

---

## 📁 Project Structure

```
student-portal/
├── app/                    # Next.js pages
│   ├── auth/login/        # Login page
│   ├── dashboard/         # Dashboard
│   ├── courses/           # Course enrollment
│   ├── my-courses/        # Student courses
│   ├── grades/            # Grades
│   ├── transcript/        # Transcript
│   └── profile/           # Profile
├── components/            # UI components
├── contexts/              # React contexts
├── lib/                   # API & types
└── utils/                 # Helper functions
```

---

## 🔧 Common Tasks

### Adding New Pages
1. Create folder in `app/`
2. Add `page.tsx` file
3. Import and use components
4. Add to Sidebar navigation if needed

### Calling API Endpoints
```typescript
import { studentProfileApi } from '@/lib/api'

const profile = await studentProfileApi.getMyProfile()
```

### Using Types
```typescript
import { StudentProfile } from '@/lib/types'

const [profile, setProfile] = useState<StudentProfile | null>(null)
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3002
npx kill-port 3002

# Or use different port
npm run dev -- -p 3003
```

### API Connection Issues
1. Check backend is running on port 5000
2. Verify `.env.local` has correct API URL
3. Check CORS settings in backend

### Login Not Working
1. Verify user has "Student" role
2. Check credentials are correct
3. Ensure backend authentication is working

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## 📚 Documentation

- **Full Documentation:** See `README.md`
- **Features Guide:** See `FEATURES.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`

---

## 🎨 Design System

### Colors
- **Primary (Maroon):** #8B1A1A
- **Primary Dark:** #6B1414
- **Success (Green):** For good grades, positive actions
- **Warning (Amber):** For warnings, pending states
- **Error (Red):** For errors, failed states

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** Bold, larger sizes
- **Body:** Regular weight, readable size

---

## 🔒 Security Notes

- ✅ All routes are protected (except login)
- ✅ JWT tokens stored in localStorage
- ✅ Automatic token refresh
- ✅ Role verification (Student only)
- ✅ Input validation on all forms
- ✅ XSS protection enabled

---

## 📱 Responsive Design

The portal is fully responsive and works on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1920px+)

---

## 🚀 Next Steps

1. ✅ Test all features
2. ✅ Create student accounts in backend
3. ✅ Customize branding if needed
4. ✅ Deploy to production (see DEPLOYMENT.md)
5. ✅ Monitor and maintain

---

## 💡 Tips

- Use the sidebar to navigate between pages
- All changes are saved to the backend
- Grades only show if published by faculty
- Enrollment requires prerequisites to be met
- Profile changes are immediate
- Password must be at least 6 characters

---

## 🆘 Need Help?

### Resources
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com

### Contact
- Technical Support: tech@gua.edu.pl
- Documentation: See project docs folder

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Backend API is accessible
- [ ] Student accounts created
- [ ] All pages load correctly
- [ ] Login works
- [ ] Enrollment works
- [ ] Grades display correctly
- [ ] Transcript generates
- [ ] Profile edits save
- [ ] Mobile responsive
- [ ] No console errors

---

**Enjoy using the GUA Student Portal! 🎓**

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
