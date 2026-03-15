# Global University America - Proje Mimarisi ve Iliskileri

## Genel Bakis

```
                          +------------------+
                          |   PostgreSQL DB   |
                          +--------+---------+
                                   |
                          +--------+---------+
                          |  .NET 8 Backend  |
                          |   (port: 5000)   |
                          +--------+---------+
                                   |
                    +--------------+--------------+
                    |              |               |
          +---------+    +--------+------+   +----+--------+   +----------+
          | Public   |   | Admin Panel   |   | Student     |   | Faculty  |
          | Site     |   | (port: 3000)  |   | Portal      |   | Portal   |
          | (3004)   |   | Auth: Admin   |   | (port: 3002)|   | (3003)   |
          | Auth: -  |   | SuperAdmin    |   | Auth: Ogrenci|   | Auth:Hoca|
          +----------+   +---------------+   +-------------+   +----------+
```

---

## 1. BACKEND API (port: 5000)

### Roller ve Yetkilendirme
| Rol | Aciklama | Erisebilecegi Paneller |
|-----|----------|----------------------|
| SuperAdmin | Tam yetki, her seyi yonetir | Admin Panel |
| Admin | Icerik ve kullanici yonetimi | Admin Panel |
| Faculty | Ders ve notlandirma islemleri | Faculty Portal |
| Student | Kendi kayitlari, notlar, transkript | Student Portal |

### Tum API Controller'lari ve Endpoint'leri

#### AuthController (`/api/auth`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | /login | Herkese acik | Email + sifre ile giris |
| POST | /register | Admin | Yeni kullanici kaydi |
| POST | /refresh | Herkese acik | Token yenileme |
| POST | /logout | Giris yapmis | Cikis |
| GET | /me | Giris yapmis | Mevcut kullanici bilgileri |

#### UsersController (`/api/users`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Admin | Tum kullanicilari listele |
| GET | /{id} | Admin | Kullanici detay |
| POST | / | Admin | Yeni kullanici olustur |
| PUT | /{id} | Admin | Kullanici guncelle |
| DELETE | /{id} | Admin | Kullanici sil |
| POST | /{id}/roles | Admin | Rol ata |
| GET | /search?query= | Admin | Kullanici ara |

#### DepartmentsController (`/api/departments`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum departmanlari listele |
| GET | /{id} | Herkese acik | Departman detay |
| POST | / | Admin | Departman olustur |
| PUT | /{id} | Admin | Departman guncelle |
| DELETE | /{id} | Admin | Departman sil |

#### ProgramsController (`/api/programs`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum programlari listele |
| GET | /{id} | Herkese acik | Program detay |
| GET | /department/{deptId} | Herkese acik | Departmana gore programlar |
| POST | / | Admin | Program olustur |
| PUT | /{id} | Admin | Program guncelle |
| DELETE | /{id} | Admin | Program sil |

#### CoursesController (`/api/courses`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum dersleri listele |
| GET | /{id} | Herkese acik | Ders detay |
| GET | /department/{deptId} | Herkese acik | Departmana gore dersler |
| POST | / | Admin | Ders olustur |
| PUT | /{id} | Admin | Ders guncelle |
| DELETE | /{id} | Admin | Ders sil |

#### AcademicTermsController (`/api/academicterms`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Giris yapmis | Tum donemler |
| GET | /{id} | Giris yapmis | Donem detay |
| GET | /current | Giris yapmis | Aktif donem |
| POST | / | Admin | Donem olustur |
| PUT | /{id} | Admin | Donem guncelle |
| DELETE | /{id} | Admin | Donem sil |

#### CourseOfferingsController (`/api/courseofferings`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Giris yapmis | Ders acilislari (termId, courseId filtre) |
| GET | /{id} | Giris yapmis | Ders acilisi detay |
| POST | / | Admin | Ders acilisi olustur |
| PUT | /{id} | Admin | Ders acilisi guncelle |
| DELETE | /{id} | Admin | Ders acilisi sil |

#### EnrollmentsController (`/api/enrollments`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | /my-enrollments | Student | Ogrencinin kayitli dersleri |
| GET | /my-available-courses | Student | Kayit olunabilir dersler |
| POST | / | Student | Derse kayit ol |
| POST | /{id}/drop | Student | Dersten cekil |
| GET | /{id} | Giris yapmis | Kayit detay |

#### GradeComponentsController (`/api/gradecomponents`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | /course-offering/{id} | Faculty | Ders icin not bilesenleri |
| POST | / | Faculty | Not bileseni olustur (odev, sinav vs) |
| PUT | /{id} | Faculty | Not bileseni guncelle |
| DELETE | /{id} | Faculty | Not bileseni sil |

#### GradesController (`/api/grades`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | /my-grades | Student | Ogrencinin notlari |
| GET | /enrollment/{id} | Giris yapmis | Kayit bazli notlar |
| POST | / | Faculty | Not gir |
| PUT | /{id} | Faculty | Not guncelle |

#### FinalGradesController (`/api/finalgrades`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | /calculate/{enrollmentId} | Faculty | Final notu hesapla |
| POST | /publish/{courseOfferingId} | Faculty | Notlari yayinla |

#### GPARecordsController (`/api/gparecords`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | /student/{studentId} | Giris yapmis | Ogrenci GPA gecmisi |
| POST | /calculate/{studentId}/{termId} | Admin/Faculty | GPA hesapla |

#### TranscriptsController (`/api/transcripts`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Admin | Tum transkriptleri listele |
| GET | /{id} | Giris yapmis | Transkript detay |
| GET | /my-transcript | Student | Kendi transkripti |
| POST | /generate | Student (Graduated) | Transkript olustur (sadece mezun ogrenci) |
| POST | /admin-generate | Admin | Herhangi ogrenci icin transkript olustur |
| GET | /history | Student | Transkript gecmisi |
| GET | /verify/{code} | Herkese acik | Diploma/sertifika dogrulama |
| DELETE | /{id} | Admin | Transkript sil |

#### AssignmentSubmissionsController (`/api/assignmentsubmissions`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | / | Student | Odev teslim et |
| GET | /my-submissions | Student | Teslim edilen odevler |
| GET | /component/{componentId} | Faculty | Bilesen bazli teslimler |
| PUT | /{id}/grade | Faculty | Odevi notla |

#### StudentProfilesController (`/api/studentprofiles`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Admin | Tum ogrenci profilleri |
| GET | /{id} | Admin | Ogrenci profil detay |
| GET | /me | Student | Kendi profilim |
| POST | / | Admin | Ogrenci profili olustur |
| PUT | /me | Student | Kendi profilimi guncelle |
| PUT | /{id} | Admin | Ogrenci profil guncelle |
| DELETE | /{id} | Admin | Ogrenci profili sil |

#### FacultyProfilesController (`/api/facultyprofiles`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum hoca profilleri |
| GET | /{id} | Herkese acik | Hoca profil detay |
| POST | / | Admin | Hoca profili olustur |
| PUT | /{id} | Admin | Hoca profil guncelle |
| PUT | /me | Faculty | Kendi profilimi guncelle |
| DELETE | /{id} | Admin | Hoca profili sil |

#### CourseMaterialsController (`/api/coursematerials`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Admin | Tum materyaller |
| GET | /{id} | Giris yapmis | Materyal detay |
| GET | /course-offering/{id} | Giris yapmis | Ders bazli materyaller |
| GET | /my-courses | Student | Kayitli derslerin materyalleri |
| POST | / | Admin/Faculty | Materyal yukle |
| PUT | /{id} | Admin/Faculty | Materyal guncelle |
| DELETE | /{id} | Admin/Faculty | Materyal sil |

#### BlogPostsController (`/api/blogposts`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum blog yazilarini listele |
| GET | /{id} | Herkese acik | Blog yazi detay |
| GET | /slug/{slug} | Herkese acik | Slug ile blog yazi |
| POST | / | Admin | Blog yazi olustur |
| PUT | /{id} | Admin | Blog yazi guncelle |
| DELETE | /{id} | Admin | Blog yazi sil |
| POST | /{id}/publish | Admin | Yaziyi yayinla |
| POST | /{id}/unpublish | Admin | Yaziyi geri cek |

#### GalleryController (`/api/gallery`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Herkese acik | Tum galeri ogelerini listele |
| GET | /{id} | Herkese acik | Galeri oge detay |
| POST | / | Admin | Galeri ogesi ekle |
| PUT | /{id} | Admin | Galeri ogesi guncelle |
| DELETE | /{id} | Admin | Galeri ogesi sil |

#### FilesController (`/api/files`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | /upload | Giris yapmis | Dosya yukle (wwwroot/uploads) |
| DELETE | / | Giris yapmis | Dosya sil |
| GET | /config | Giris yapmis | Dosya yapilandirma bilgileri |

#### ApplicationsController (`/api/applications`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | / | Herkese acik | Basvuru gonder (onay emaili gonderir) |
| GET | / | Admin | Tum basvurulari listele |
| PUT | /{id}/status | Admin | Basvuru durumunu guncelle |

#### ContactController (`/api/contact`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| POST | / | Herkese acik | Iletisim formu gonder (email bildirimi gonderir) |

#### AuditLogsController (`/api/auditlogs`)
| Method | Endpoint | Yetki | Aciklama |
|--------|----------|-------|----------|
| GET | / | Admin | Denetim kayitlari |

---

## 2. ADMIN PANEL (port: 3000)

**Amac:** Universite yoneticilerinin tum verileri yonetmesi
**Auth:** SuperAdmin veya Admin rolu gerekli

### Sayfa Haritasi ve Islevleri

| Sayfa | Rota | CRUD | Aciklama |
|-------|------|------|----------|
| Login | /auth/login | - | Admin girisi |
| Dashboard | /dashboard | R | Genel istatistikler |
| **Departmanlar** | /departments | R | Departman listesi |
| | /departments/create | C | Yeni departman |
| | /departments/[id]/edit | U | Departman duzenle |
| **Programlar** | /programs | R,D | Program listesi + silme |
| | /programs/create | C | Yeni program (departman secimi, derece tipi) |
| | /programs/[id]/edit | U | Program duzenle |
| **Dersler** | /courses | R,D | Ders listesi |
| | /courses/create | C | Yeni ders (departman, kredi, syllabus) |
| | /courses/[id]/edit | U | Ders duzenle |
| **Akademik Donemler** | /academic-terms | R,D | Donem listesi |
| | /academic-terms/create | C | Yeni donem (tarihler, kayit tarihleri) |
| | /academic-terms/[id]/edit | U | Donem duzenle |
| **Ders Acilislari** | /course-offerings | R,D | Ders acilisi listesi |
| | /course-offerings/create | C | Ders ac (donem, ders, hoca, kapasite, program) |
| | /course-offerings/[id]/edit | U | Ders acilisi duzenle |
| **Ders Materyalleri** | /course-materials | R,D | Materyal listesi |
| | /course-materials/create | C | Materyal yukle (dosya + ders secimi) |
| | /course-materials/[id]/edit | U | Materyal duzenle |
| **Hoca Profilleri** | /faculty | R,D | Hoca listesi |
| | /faculty/create | C | Hoca profili olustur (kullanici sec, bio, foto) |
| | /faculty/[id]/edit | U | Hoca profili duzenle |
| **Ogrenci Profilleri** | /student-profiles | R,D | Ogrenci listesi (programa gore filtre) |
| | /student-profiles/create | C | Ogrenci profili olustur (kullanici sec, program) |
| | /student-profiles/[id]/edit | U | Ogrenci profili duzenle |
| **Blog Yazilari** | /blog | R,D | Blog listesi + yayinla/geri cek |
| | /blog/create | C | Blog yazi olustur (baslik, icerik, gorsel, kategori) |
| | /blog/[id]/edit | U | Blog yazi duzenle |
| **Galeri** | /gallery | R,D | Galeri listesi |
| | /gallery/create | C | Gorsel ekle (baslik, gorsel, kategori) |
| | /gallery/[id]/edit | U | Gorsel duzenle |
| **Kayitlar** | /enrollments | R | Ogrenci ders kayitlari (ogrenci/donem/durum filtre) |
| **Notlar & GPA** | /grades | R | GPA kayitlari + Final notlari (tab gorunumu) |
| **Transkriptler** | /transcripts | R,C,D | Transkript listesi + olusturma + silme |
| **Kullanicilar** | /users | R,D | Kullanici listesi |
| | /users/create | C | Yeni kullanici (ad, email, sifre, rol) |
| | /users/[id]/edit | U | Kullanici duzenle |
| | /users/[id]/roles | U | Rol yonetimi |

### Admin Panel Veri Akisi
```
Admin Panel'de olusturulan veriler --> Backend API --> PostgreSQL DB
                                                          |
                                                          v
                                               Public Site'da goruntulenir
                                               Student/Faculty Portal'da kullanilir
```

---

## 3. STUDENT PORTAL (port: 3002)

**Amac:** Ogrencilerin derslerini, notlarini ve transkriptlerini takip etmesi
**Auth:** Student rolu gerekli

### Sayfa Haritasi ve Islevleri

| Sayfa | Rota | Islem | Aciklama |
|-------|------|-------|----------|
| Login | /auth/login | Auth | Ogrenci girisi |
| Dashboard | /dashboard | R | GPA, kredi, aktif dersler ozeti |
| Profilim | /profile | R,U | Kisisel bilgiler, sifre degistirme |
| Derslerim | /my-courses | R | Kayitli oldugum dersler (donem filtre) |
| Tum Dersler | /courses | R,C | Mevcut dersler + kayit olma butonu |
| Notlarim | /grades | R | Notlar listesi (donem filtre) |
| Not Detay | /grades/[enrollmentId] | R | Tek dersin not bilesenleri (odev, sinav notlari) |
| Materyaller | /materials | R | Kayitli derslerin materyalleri |
| Materyal Detay | /materials/[courseOfferingId] | R | Belirli dersin materyalleri + odev teslim |
| Transkript | /transcript | R | Donem donem GPA + ders notlari |
| Transkript Gecmisi | /transcript/history | R | Olusturulan transkriptler + dogrulama kodlari |

### Ogrenci Akisi
```
1. Ogrenci login olur
2. Dashboard'da GPA, kredi ve aktif dersleri gorur
3. /courses'tan yeni doneme kayit olur (enroll)
4. /my-courses'tan kayitli derslerini takip eder
5. /materials'tan ders materyallerini indirir
6. /grades'ten odev/sinav notlarini gorur
7. /transcript'ten toplam akademik performansini gorur
```

---

## 4. FACULTY PORTAL (port: 3003)

**Amac:** Hocalarin derslerini yonetmesi ve ogrencileri notlandirmasi
**Auth:** Faculty rolu gerekli

### Sayfa Haritasi ve Islevleri

| Sayfa | Rota | Islem | Aciklama |
|-------|------|-------|----------|
| Login | /auth/login | Auth | Hoca girisi |
| Dashboard | /dashboard | R | Verilen dersler ozeti |
| Profilim | /profile | R,U | Hoca profili duzenleme |
| Derslerim | /courses | R | Verdigi derslerin listesi |
| Ders Detay | /courses/[courseOfferingId] | R | Ders detay + kayitli ogrenciler |
| Notlandirma | /grades | R | Ders secimi (not girilecek ders sec) |
| Not Girisi | /grades/[courseOfferingId] | R,C,U | Not bilesenleri + ogrenci notlari girisi |
| Odev Teslim | /grades/submissions/[componentId] | R,U | Ogrenci teslimlerini gor + notla |
| Materyaller | /materials | R,C,U,D | Ders materyali yukle/duzenle/sil |

### Hoca Akisi
```
1. Hoca login olur
2. Dashboard'da verdigi dersleri gorur
3. /courses'tan ders detayina girer, kayitli ogrencileri gorur
4. /grades'ten not girecegi dersi secer
5. /grades/[id]'de not bileseni olusturur (Midterm %30, Final %40, Odev %30)
6. Her bilesen icin ogrencilere puan girer
7. /grades/submissions'ta odev teslimlerini gorur ve notlar
8. Final notunu hesaplar ve yayinlar
9. /materials'tan ders materyali yukler
```

---

## 5. PUBLIC SITE (port: 3004)

**Amac:** Dunya'ya acik, herkesin erisebilecegi universite web sitesi
**Auth:** Yok (tamamen herkese acik)

### Sayfa Haritasi ve Veri Kaynaklari

| Sayfa | Rota | Veri Kaynagi | Aciklama |
|-------|------|-------------|----------|
| Ana Sayfa | / | departments, programs, faculty | Hero, istatistik, departmanlar, hocalar, testimonial, FAQ |
| Hakkimizda | /about | Statik | Universite hikayesi, misyon/vizyon |
| Programlar | /programs | departments, programs | Departmana gore filtreleme |
| Program Detay | /programs/[id] | programs, departments, courses | Program bilgisi + ilgili dersler |
| Departmanlar | /departments | departments, programs | Departman kartlari |
| Departman Detay | /departments/[id] | departments, programs, courses | Departman + programlar + dersler |
| Hocalar | /faculty | facultyProfiles | Hoca kartlari |
| Hoca Detay | /faculty/[id] | facultyProfiles | Bio, arastirma, yayinlar |
| Blog | /blog | blogPosts | Yayinlanmis yazilar |
| Blog Detay | /blog/[id] | blogPosts | Tam yazi |
| Galeri | /gallery | gallery | Gorsel galeri + lightbox |
| Iletisim | /contact | contactApi | Iletisim formu (backend'e POST yapar, email gonderir) |
| Basvuru | /apply | departments, programs, applicationsApi | Basvuru formu (backend'e POST yapar, onay emaili gonderir) |
| Diploma Sorgulama | /diploma-inquiry | transcriptsApi (verify) | Sertifika/diploma dogrulama (GUA-YYYY-XXXXX kodu ile) |

---

## 6. VERI ILISKILERI ve AKIS HARITASI

### Admin Panel'den Public Site'a Akan Veriler
```
Admin Panel                          Public Site
-----------                          -----------
Departman CRUD    ───────────>       /departments sayfasi
Program CRUD      ───────────>       /programs sayfasi
Hoca Profil CRUD  ───────────>       /faculty sayfasi
Blog Yazi CRUD    ───────────>       /blog sayfasi (sadece isPublished=true)
Galeri CRUD       ───────────>       /gallery sayfasi
Ders CRUD         ───────────>       /departments/[id] ve /programs/[id] sayfasinda
```

### Admin Panel'den Student/Faculty Portal'a Akan Veriler
```
Admin Panel                          Student Portal / Faculty Portal
-----------                          --------------------------------
Kullanici olusturma  ───────>        Login yapabilmesi icin
Rol atama            ───────>        Hangi portal'a giris yapabilecegi
Ogrenci profili      ───────>        Student Portal'da gorunur
Hoca profili         ───────>        Faculty Portal'da gorunur
Ders acilisi         ───────>        Ogrenci kayit olabilir, hoca ders gorebilir
Donem olusturma      ───────>        Tum portallarda donem filtresi
Ders materyali       ───────>        Ogrenci ve hoca erisebilir
```

### Faculty Portal'dan Student Portal'a Akan Veriler
```
Faculty Portal                       Student Portal
--------------                       ---------------
Not bileseni olustur  ───────>       Ogrenci not bilesenlerini gorur
Not girisi            ───────>       Ogrenci notlarini gorur
Final notu hesapla    ───────>       Ogrenci final notunu gorur
Final notu yayinla    ───────>       Transkriptte gorunur
Ders materyali yukle  ───────>       Ogrenci materyali indirir
```

### Ogrenci Eylemi Dongusu
```
Admin: Kullanici olustur (Student rolu) + Ogrenci profili olustur
  |
  v
Admin: Donem olustur + Ders acilisi olustur (hoca ata)
  |
  v
Student: Login -> Derse kayit ol (enroll)
  |
  v
Faculty: Not bileseni olustur (Midterm, Final, Odev)
  |
  v
Student: Odev teslim et (assignment submission)
  |
  v
Faculty: Odevi notla + Sinav notlarini gir
  |
  v
Faculty: Final notu hesapla + yayinla
  |
  v
Student: Notlari ve transkripti gor
```

---

## 7. VERITABANI ENTITY ILISKILERI

```
Department (1) ──────< (N) Program
Department (1) ──────< (N) Course

Program (1) ──────< (N) StudentProfile

Course (1) ──────< (N) CourseOffering
AcademicTerm (1) ──────< (N) CourseOffering
FacultyProfile (1) ──────< (N) CourseOffering

CourseOffering (1) ──────< (N) Enrollment
CourseOffering (1) ──────< (N) GradeComponent
CourseOffering (1) ──────< (N) CourseMaterial

StudentProfile (1) ──────< (N) Enrollment

Enrollment (1) ──────< (N) Grade
Enrollment (1) ──────< (1) FinalGrade

GradeComponent (1) ──────< (N) Grade
GradeComponent (1) ──────< (N) AssignmentSubmission

User (1) ──────< (1) StudentProfile
User (1) ──────< (1) FacultyProfile
User (N) ──────< (N) Role  (via UserRole)

BlogPost, GalleryItem, Application, AuditLog --> Bagimsiz entity'ler
```

---

## 8. TAMAMLANAN OZELLIKLER

### Public Site
- [x] CORS hatasi duzeltildi (appsettings.json'a localhost:3004 eklendi)
- [x] Resim URL'leri duzeltildi - getFileUrl() helper ile backend URL prefix'i ekleniyor (gallery, blog, faculty)
- [x] Faculty detail sayfasi: profileImageUrl -> photoUrl alan adi duzeltildi (backend DTO ile eslesti)
- [x] Faculty detail sayfasi: gereksiz buyuk hero alani kaldirildi, breadcrumb'a donusturuldu
- [x] Contact formu backend'e POST yapiyor (ContactController + EmailService ile email gonderimi)
- [x] Apply formu backend'e POST yapiyor (ApplicationsController + onay emaili gonderimi)
- [x] Diploma sorgulama backend entegrasyonu (GET /api/transcripts/verify/{code} - AllowAnonymous)

### Admin Panel
- [x] Dashboard istatistikleri gercek veri cekiyor (departments, programs, courses, users API'lerinden paralel cekim)
- [x] Gallery edit formu: isActive alani eklendi (onceden gonderilmiyordu, update'de false oluyordu)
- [x] Dashboard "Recent Activity" - AuditLog API'den gercek veri cekiyor + Applications istatistigi eklendi
- [x] AuditLog sayfasi (/audit-logs) - tablo, pagination, detay gosterimi (old/new value)
- [x] Enrollments sayfasi (/enrollments) - ogrenci kayit listesi, durum/donem/ogrenci filtresi
- [x] Grades & GPA sayfasi (/grades) - GPA kayitlari tab + Final notlari tab (ders bazli)
- [x] Transcripts sayfasi (/transcripts) - transkript listesi, olusturma, silme, dogrulama kodlari

### Student Portal
- [x] Dosya yukleme (odev teslimi) Files API entegrasyonu mevcut (upload + download + submission)
- [x] GPA hesaplama otomasyonu (TermCreditsEarned bug duzeltildi, tam calisir durumda)
- [x] Transkript field mapping duzeltildi (backend DTO alan adlari ile eslesti)
- [x] Grade components field mapping duzeltildi (componentGrades -> gradeComponents)
- [x] Transcript history sayfasi (/transcript/history) - dogrulama kodlarini gosterir
- [x] getFinalGrade API metodu eklendi

### Faculty Portal
- [x] Final not hesaplama ve yayinlama (tekli ve toplu yayinlama calisir durumda)
- [x] GradeTable undefined check duzeltildi

### Backend
- [x] Kapsamli test verisi SQL scripti olusturuldu (backend/seed-test-data.sql)
- [x] ApplicationsController (basvuru yonetimi) - public site apply formu + admin panel listeleme/durum guncelleme
- [x] ContactController (iletisim formu) - public site contact formu
- [x] Email bildirim sistemi (Brevo SMTP - smtp-relay.brevo.com:587, gunluk 300 ucretsiz email)
- [x] Diploma/sertifika dogrulama endpoint'i (GET /api/transcripts/verify/{code} - AllowAnonymous)
- [x] Transcript generate route duzeltildi (POST /generate + POST /admin-generate)
- [x] Transcript history endpoint eklendi (GET /history)
- [x] Verification code uretimi (GUA-YYYY-XXXXX formati, RandomNumberGenerator)
- [x] Mezuniyet kontrolu - Student sadece Graduated ise transcript olusturabilir, Admin override edebilir
- [x] GPARecords controller bug duzeltildi (TermCreditsEarned hesaplama)

---

## 9. PORT TABLOSU

| Servis | Port | URL |
|--------|------|-----|
| Backend API | 5000 | http://localhost:5000/api |
| Swagger Docs | 5000 | http://localhost:5000/swagger |
| Admin Panel | 3000 | http://localhost:3000 |
| Student Portal | 3002 | http://localhost:3002 |
| Faculty Portal | 3003 | http://localhost:3003 |
| Public Site | 3004 | http://localhost:3004 |

---

## 10. ORTAK TEKNIK ALTYAPI

- **Backend:** .NET 8, EF Core, PostgreSQL, JWT Auth, BCrypt
- **Tum Frontend'ler:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Form Dogrulama:** React Hook Form + Zod (admin, student, faculty)
- **HTTP Client:** Axios (tum frontend'ler)
- **Auth Mekanizmasi:** JWT Bearer Token + Refresh Token (localStorage)
- **API Response Format:** `{ success: bool, data: T, message: string, errors: string[] }`

---

## 11. GIRIS BILGILERI (Test Ortami)

Tum sifreler: `Test1234!`

| Panel | Email | Rol |
|-------|-------|-----|
| Admin | admin@gua.edu.pl | SuperAdmin |
| Admin | admin2@test.gua.edu | Admin |
| Faculty | prof.smith@test.gua.edu | Faculty (CS) |
| Faculty | prof.johnson@test.gua.edu | Faculty (BA) |
| Faculty | prof.williams@test.gua.edu | Faculty (ENG) |
| Faculty | prof.brown@test.gua.edu | Faculty (DS) |
| Student | ali.yilmaz@test.gua.edu | Student (CS - 3 ders) |
| Student | ayse.demir@test.gua.edu | Student (BA - 1 ders) |
| Student | mehmet.kaya@test.gua.edu | Student (CS - 2 ders) |
| Student | emma.wilson@test.gua.edu | Student (ENG - 2 ders) |
| Student | james.taylor@test.gua.edu | Student (DS - 1 ders) |
