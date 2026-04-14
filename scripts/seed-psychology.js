#!/usr/bin/env node
// Seed Psychology BA: department, program, courses, curriculum, academic term, faculty, course offerings.
// Idempotent — safe to re-run. Uploads PDFs + creates CourseMaterial records.
//
// Usage:
//   node seed-psychology.js [--api=http://localhost:5000/api] [--email=admin@gua.edu.pl] [--password=Admin123!] [--materials=<abs path>] [--skip-upload]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PSYCHOLOGY_BA, COURSES, ACADEMIC_TERM, DUMMY_FACULTY } from './psychology-curriculum.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ------------- CLI args -------------
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...rest] = a.replace(/^--/, '').split('=');
  return [k, rest.join('=') || true];
}));

const API = (args.api || process.env.GUA_API || 'http://localhost:5000/api').replace(/\/$/, '');
const EMAIL = args.email || process.env.GUA_ADMIN_EMAIL || 'admin@gua.edu.pl';
const PASSWORD = args.password || process.env.GUA_ADMIN_PASSWORD || 'Admin123!';
const MATERIALS_ROOT = args.materials || process.env.GUA_MATERIALS || 'C:/Users/berat/OneDrive/Desktop/Psychology_BA_Materials';
const SKIP_UPLOAD = !!args['skip-upload'];

let TOKEN = null;

// ------------- helpers -------------
const log = (...m) => console.log('›', ...m);
const warn = (...m) => console.warn('⚠', ...m);
const err = (...m) => console.error('✗', ...m);

async function api(method, pathUrl, body, isForm = false) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  let payload = undefined;
  if (body !== undefined) {
    if (isForm) {
      payload = body;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }
  const res = await fetch(API + pathUrl, { method, headers, body: payload });
  let json = null;
  const text = await res.text();
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`${method} ${pathUrl} failed ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function login() {
  log(`Logging in as ${EMAIL}`);
  const res = await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  TOKEN = res.data?.accessToken || res.data?.token || res.token;
  if (!TOKEN) throw new Error('No token in login response: ' + JSON.stringify(res));
  log('  ✓ authenticated');
}

async function ensureDepartment() {
  const list = await api('GET', '/departments');
  const existing = (list.data || list).find(d => d.code === PSYCHOLOGY_BA.department.code);
  if (existing) { log(`Department '${existing.name}' exists (id=${existing.id})`); return existing; }
  log(`Creating department '${PSYCHOLOGY_BA.department.name}'`);
  const created = await api('POST', '/departments', PSYCHOLOGY_BA.department);
  return created.data;
}

async function ensureProgram(deptId) {
  const list = await api('GET', '/programs');
  const existing = (list.data || list).find(p => p.name === PSYCHOLOGY_BA.program.name);
  if (existing) { log(`Program '${existing.name}' exists (id=${existing.id})`); return existing; }
  log(`Creating program '${PSYCHOLOGY_BA.program.name}'`);
  const { degreeType, ...rest } = PSYCHOLOGY_BA.program;
  const created = await api('POST', '/programs', { departmentId: deptId, degreeType, ...rest });
  return created.data;
}

async function ensureCourses(deptId) {
  const list = await api('GET', '/courses');
  const existing = new Map((list.data || list).map(c => [c.code, c]));
  const result = [];
  for (const c of COURSES) {
    if (existing.has(c.code)) {
      result.push(existing.get(c.code));
      continue;
    }
    log(`  + creating course ${c.code} — ${c.name}`);
    try {
      const created = await api('POST', '/courses', {
        departmentId: deptId, code: c.code, name: c.name, credits: c.credits, description: c.description
      });
      result.push(created.data);
    } catch (e) {
      warn(`  × failed creating ${c.code}: ${e.message}`);
    }
  }
  log(`Courses ready: ${result.length}/${COURSES.length}`);
  return result;
}

async function ensureCurriculum(programId, courses) {
  const existing = await api('GET', `/programs/${programId}/curriculum`);
  const existingCourseIds = new Set((existing.data?.years || []).flatMap(y => y.courses.map(c => c.courseId)));
  const codeToId = new Map(courses.map(c => [c.code, c.id]));
  const toAdd = [];
  for (const c of COURSES) {
    const cid = codeToId.get(c.code);
    if (!cid) { warn(`  course missing: ${c.code}`); continue; }
    if (existingCourseIds.has(cid)) continue;
    toAdd.push({ courseId: cid, yearLevel: c.year, isRequired: c.required, sortOrder: c.sort });
  }
  if (!toAdd.length) { log('Curriculum already assigned'); return; }
  log(`Adding ${toAdd.length} courses to curriculum`);
  const res = await api('POST', `/programs/${programId}/curriculum/bulk`, { courses: toAdd });
  log(`  ✓ ${res.data} added`);
}

async function ensureAcademicTerm() {
  const list = await api('GET', '/academicterms');
  const existing = (list.data || list).find(t => t.code === ACADEMIC_TERM.code);
  if (existing) { log(`Term '${existing.name}' exists (id=${existing.id})`); return existing; }
  log(`Creating term '${ACADEMIC_TERM.name}'`);
  const created = await api('POST', '/academicterms', ACADEMIC_TERM);
  return created.data;
}

async function ensureFacultyUser() {
  const users = await api('GET', '/users');
  const existingUser = (users.data || users).find(u => u.email === DUMMY_FACULTY.email);
  let userId = existingUser?.id;
  if (!userId) {
    log(`Creating faculty user ${DUMMY_FACULTY.email}`);
    const created = await api('POST', '/users', {
      email: DUMMY_FACULTY.email,
      password: DUMMY_FACULTY.password,
      firstName: DUMMY_FACULTY.firstName,
      lastName: DUMMY_FACULTY.lastName,
      roleNames: ['Faculty'],
      isActive: true
    });
    userId = created.data?.id;
  } else {
    log(`Faculty user exists (${existingUser.email})`);
  }

  const profiles = await api('GET', '/facultyprofiles');
  let profile = (profiles.data || profiles).find(p => p.userId === userId);
  if (!profile) {
    log('Creating faculty profile');
    const created = await api('POST', '/facultyprofiles', {
      userId,
      title: DUMMY_FACULTY.title,
      bio: DUMMY_FACULTY.bio
    });
    profile = created.data;
  } else {
    log(`Faculty profile exists (id=${profile.id})`);
  }
  return profile;
}

async function ensureCourseOfferings(termId, facultyId, courses) {
  const list = await api('GET', '/courseofferings');
  const existingByCourse = new Map();
  for (const o of (list.data || list)) {
    if (o.termId === termId) existingByCourse.set(o.courseId, o);
  }
  const result = new Map();
  for (const c of courses) {
    if (existingByCourse.has(c.id)) { result.set(c.id, existingByCourse.get(c.id)); continue; }
    log(`  + offering for ${c.code}`);
    try {
      const created = await api('POST', '/courseofferings', {
        courseId: c.id, termId, facultyProfileId: facultyId,
        section: 'A', capacity: 10000, schedule: 'Self-paced / always available',
        location: 'Online', isActive: true
      });
      result.set(c.id, created.data);
    } catch (e) {
      warn(`  × offering for ${c.code}: ${e.message}`);
    }
  }
  log(`Offerings ready: ${result.size}`);
  return result;
}

async function uploadFile(fullPath, folder) {
  const data = await fs.promises.readFile(fullPath);
  const fileName = path.basename(fullPath);
  const form = new FormData();
  const blob = new Blob([data], { type: 'application/pdf' });
  form.append('File', blob, fileName);
  form.append('Folder', folder);
  const res = await fetch(`${API}/files/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: form
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`upload ${fileName}: ${res.status} ${JSON.stringify(json)}`);
  return json.data;
}

function walkPdfs(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkPdfs(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) out.push(full);
  }
  return out;
}

async function uploadMaterials(courses, offerings, faculty) {
  if (SKIP_UPLOAD) { log('Skipping material upload'); return; }

  // CourseMaterials endpoint derives faculty from JWT — must authenticate as faculty
  const adminToken = TOKEN;
  log(`Authenticating as ${DUMMY_FACULTY.email} for uploads`);
  try {
    const facRes = await api('POST', '/auth/login', { email: DUMMY_FACULTY.email, password: DUMMY_FACULTY.password });
    TOKEN = facRes.data?.accessToken || facRes.data?.token;
  } catch (e) {
    warn(`  faculty login failed: ${e.message}`);
    TOKEN = adminToken;
    return;
  }

  const existingMaterials = await api('GET', '/coursematerials');
  const byCourse = new Map();
  for (const m of (existingMaterials.data || existingMaterials)) {
    if (!byCourse.has(m.courseId)) byCourse.set(m.courseId, new Set());
    byCourse.get(m.courseId).add(m.title);
  }
  const codeToId = new Map(courses.map(c => [c.code, c.id]));

  let totalUploaded = 0, totalSkipped = 0, totalFailed = 0;
  for (const spec of COURSES) {
    const courseId = codeToId.get(spec.code);
    if (!courseId) continue;
    const offering = offerings.get(courseId);
    if (!offering) { warn(`  no offering for ${spec.code}`); continue; }
    const knownTitles = byCourse.get(courseId) || new Set();

    const pdfs = [];
    for (const folder of spec.folders) {
      pdfs.push(...walkPdfs(path.join(MATERIALS_ROOT, folder)));
    }
    if (!pdfs.length) { log(`  (no PDFs for ${spec.code})`); continue; }

    log(`${spec.code}: ${pdfs.length} PDFs`);
    for (const pdf of pdfs) {
      const title = path.basename(pdf, '.pdf').slice(0, 290);
      if (knownTitles.has(title)) { totalSkipped++; continue; }
      try {
        const uploaded = await uploadFile(pdf, `coursematerials/${spec.code}`);
        await api('POST', '/coursematerials', {
          courseOfferingId: offering.id,
          title,
          description: `Open-licensed material for ${spec.code}`,
          fileUrl: uploaded.fileUrl,
          fileType: 'PDF',
          isActive: true
        });
        totalUploaded++;
        log(`    ✓ ${title}`);
      } catch (e) {
        totalFailed++;
        warn(`    × ${title}: ${e.message}`);
      }
    }
  }
  log(`Materials: ${totalUploaded} uploaded, ${totalSkipped} existed, ${totalFailed} failed`);
  TOKEN = adminToken;
}

// ------------- main -------------
(async () => {
  try {
    log(`API = ${API}`);
    log(`Materials = ${MATERIALS_ROOT}`);
    await login();
    const dept = await ensureDepartment();
    const program = await ensureProgram(dept.id);
    const courses = await ensureCourses(dept.id);
    await ensureCurriculum(program.id, courses);
    const term = await ensureAcademicTerm();
    const faculty = await ensureFacultyUser();
    const offerings = await ensureCourseOfferings(term.id, faculty.id, courses);
    await uploadMaterials(courses, offerings, faculty);
    log('DONE.');
  } catch (e) {
    err(e.stack || e.message);
    process.exit(1);
  }
})();
