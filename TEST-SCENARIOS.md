# GUA - Manuel Test Senaryolari

## Giris Bilgileri (tum sifreler: Test1234!)

| Panel | Email | Rol |
|-------|-------|-----|
| Admin | admin@gua.edu.pl | SuperAdmin |
| Admin | admin2@test.gua.edu | Admin |
| Faculty | prof.smith@test.gua.edu | Faculty (CS) |
| Faculty | prof.johnson@test.gua.edu | Faculty (BA) |
| Faculty | prof.williams@test.gua.edu | Faculty (ENG) |
| Faculty | prof.brown@test.gua.edu | Faculty (DS) |
| Student | ali.yilmaz@test.gua.edu | Student (CS - 3 ders kayitli) |
| Student | ayse.demir@test.gua.edu | Student (BA - 1 ders kayitli) |
| Student | mehmet.kaya@test.gua.edu | Student (CS - 2 ders kayitli) |
| Student | emma.wilson@test.gua.edu | Student (ENG - 2 ders kayitli) |
| Student | james.taylor@test.gua.edu | Student (DS - 1 ders kayitli) |

## Port Bilgileri

| Uygulama | Port | URL |
|-----------|------|-----|
| Backend API | 5000 | http://localhost:5000/api |
| Admin Panel | 3000 | http://localhost:3000 |
| Student Portal | 3001 | http://localhost:3001 |
| Faculty Portal | 3003 | http://localhost:3003 |
| Public Site | 3004 | http://localhost:3004 |

---

# A. PUBLIC SITE (http://localhost:3004) ✅ TAMAMLANDI

## A1. Ana Sayfa
- [x] Sayfa aciliyor mu?
- [x] Header gorunuyor mu? (Logo, navigasyon linkleri)
- [x] Ust bilgi bari gorunuyor mu? (email, lokasyon, sosyal medya)
- [x] Hero slider/banner gorunuyor mu?
- [x] Programs/Departments bolumu gorunuyor mu?
- [x] FAQ bolumu acilip kapaniyor mu?
- [x] Testimonials carousel calisyor mu?
- [x] Footer gorunuyor mu? (linkler, iletisim bilgileri)
- [x] WhatsApp widget sag altta gorunuyor mu?

## A2. About Sayfasi (/about)
- [x] Sayfa aciliyor mu?
- [x] Icerik dogru gorunuyor mu?
- [x] Gorseller yukleniyor mu?

## A3. Departments Sayfasi (/departments)
- [x] Departman listesi yukleniyor mu? (API'den)
- [x] Her departman kartinda isim ve aciklama var mi?
- [x] Departman detay sayfasina tiklanabiliyor mu?

## A4. Department Detay (/departments/[id])
- [x] Departman bilgileri gorunuyor mu?
- [x] Departmana ait programlar listeleniyor mu?

## A5. Programs Sayfasi (/programs)
- [x] Program listesi yukleniyor mu?
- [x] Her programda isim, departman, kredi bilgisi var mi?
- [x] Program detay sayfasina gidilebiliyor mu?

## A6. Program Detay (/programs/[id])
- [x] Program bilgileri gorunuyor mu?
- [x] Programa ait dersler listeleniyor mu?

## A7. Faculty Sayfasi (/faculty)
- [x] Fakulte uyeleri listeleniyor mu?
- [x] Her kartta isim, unvan, departman var mi?
- [x] Profil fotolari yukleniyor mu?
- [x] Detay sayfasina gidilebiliyor mu?

## A8. Faculty Detay (/faculty/[id])
- [x] Fakulte uyesi bilgileri gorunuyor mu? (bio, unvan, departman)
- [x] Iletisim bilgileri var mi?

## A9. Blog Sayfasi (/blog)
- [x] Blog yazilari listeleniyor mu?
- [x] Baslik, tarih, ozet gorunuyor mu?
- [x] Kapak gorseli yukleniyor mu?
- [x] Detay sayfasina gidilebiliyor mu?

## A10. Blog Detay (/blog/[id])
- [x] Yazi icerigi tam gorunuyor mu?
- [x] Gorseller yukleniyor mu?
- [x] Tarih ve yazar bilgisi var mi?

## A11. Gallery Sayfasi (/gallery)
- [x] Gorseller grid seklinde yukleniyor mu?
- [x] Basliklar gorunuyor mu?

## A12. Contact Sayfasi (/contact)
- [x] Form alanlari gorunuyor mu? (isim, email, konu, mesaj)
- [x] Bos form gonderilmeye calisildiginda validasyon calisiyor mu?
- [x] Dolu form gonderildiginde basarili mesaji geliyor mu?
- [x] Backend'e POST /api/Contact gidiyor mu? (Network tab)

## A13. Apply Sayfasi (/apply)
- [x] Basvuru formu gorunuyor mu?
- [x] Program secimi dropdown'unda programlar listeleniyor mu?
- [x] Tum zorunlu alanlar icin validasyon calisiyor mu?
- [x] Form gonderildiginde basarili mesaji geliyor mu?
- [x] Backend'e POST /api/Applications gidiyor mu?

## A14. Diploma Inquiry (/diploma-inquiry)
- [x] Dogrulama formu gorunuyor mu?
- [x] Bos kod ile gonderildiginde uyari var mi?
- [x] Yanlis kod girildiginde "Invalid Code" hatasi gorunuyor mu?
- [x] Gecerli kod girildiginde ogrenci bilgileri gorunuyor mu?
  - [x] Ogrenci adi, numarasi
  - [x] Program, departman
  - [x] GPA, kredi
  - [x] Belge tarihi, dogrulama kodu
- [x] Loading spinner calisiyor mu?

## A15. Navigasyon Genel
- [x] Tum header linkleri dogru sayfalara yonlendiriyor mu?
- [x] Footer linkleri calisiyor mu?
- [x] Mobil gorunumde hamburger menu calisiyor mu?
- [x] Sayfa gecislerinde hata olmuyor mu?

---

# B. ADMIN PANEL (http://localhost:3000) ✅ TAMAMLANDI

## B1. Giris (Login)
- [x] Login sayfasi aciliyor mu?
- [x] Yanlis sifre ile girildiginde hata mesaji gorunuyor mu?
- [x] Dogru bilgilerle giris yapilabiliyor mu? (admin@gua.edu.pl / Test1234!)
- [x] Giris sonrasi dashboard'a yonlendirme calisiyor mu?
- [x] Student hesabi ile giris denendiginde ne oluyor? (erisim engeli beklenir)

## B2. Dashboard (/dashboard)
- [x] Istatistik kartlari gorunuyor mu? (kullanici, ogrenci, ders sayilari vb.)
- [x] Sidebar navigasyonu gorunuyor mu?
- [x] Tum sidebar linkleri tiklanabiliyor mu?
- [x] Kullanici bilgileri sidebar altinda gorunuyor mu?
- [x] Logout butonu calisiyor mu?

## B3. Departments CRUD
- [x] **/departments** - Liste gorunuyor mu?
- [x] **/departments/create** - Yeni departman olusturulabiliyor mu?
  - [x] Isim ve aciklama girilip kaydediliyor mu?
  - [x] Bos alanlarla kayit denenince validasyon var mi?
- [x] **/departments/[id]/edit** - Duzenleme calisiyor mu?
  - [x] Mevcut bilgiler form'a dolduruluyor mu?
  - [x] Guncelleme basarili oluyor mu?
- [x] Silme islemi calisiyor mu? (confirm dialog)

## B4. Programs CRUD
- [x] **/programs** - Program listesi gorunuyor mu?
- [x] **/programs/create** - Yeni program olusturulabiliyor mu?
  - [x] Departman secimi dropdown calisiyor mu?
  - [x] Isim, kod, kredi, sure alanlari var mi?
- [x] **/programs/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B5. Courses CRUD
- [x] **/courses** - Ders listesi gorunuyor mu?
- [x] **/courses/create** - Yeni ders olusturulabiliyor mu?
  - [x] Departman secimi var mi?
  - [x] Kod, isim, kredi, aciklama alanlari var mi?
- [x] **/courses/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B6. Academic Terms CRUD
- [x] **/academic-terms** - Donem listesi gorunuyor mu?
- [x] **/academic-terms/create** - Yeni donem olusturulabiliyor mu?
  - [x] Isim, kod, baslangic/bitis tarihi, aktif durumu
- [x] **/academic-terms/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B7. Course Offerings CRUD
- [x] **/course-offerings** - Ders acilislari gorunuyor mu?
- [x] **/course-offerings/create** - Yeni acilis olusturulabiliyor mu?
  - [x] Ders secimi, donem secimi, fakulte secimi dropdown'lari calisiyor mu?
  - [x] Section, kapasite alanlari var mi?
- [x] **/course-offerings/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B8. Course Materials CRUD
- [x] **/course-materials** - Materyal listesi gorunuyor mu?
- [x] **/course-materials/create** - Yeni materyal yuklenebiliyor mu?
  - [x] Dosya yukleme calisiyor mu?
  - [x] Course offering secimi var mi?
  - [x] Baslik, aciklama alanlari var mi?
- [x] **/course-materials/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B9. Faculty Profiles CRUD
- [x] **/faculty** - Fakulte uyeleri listeleniyor mu?
- [x] **/faculty/create** - Yeni profil olusturulabiliyor mu?
  - [x] Kullanici secimi dropdown calisiyor mu?
  - [x] Departman secimi var mi?
  - [x] Unvan, bio, ofis, telefon alanlari var mi?
- [x] **/faculty/[id]/edit** - Duzenleme calisiyor mu?
  - [x] Profil fotografi yuklenebiliyor mu?
- [x] Silme calisiyor mu?

## B10. Student Profiles
- [x] **/student-profiles** - Ogrenci listesi gorunuyor mu?
  - [x] Her ogrencide numara, isim, program, durum gorunuyor mu?
- [x] **/student-profiles/create** - Yeni ogrenci profili olusturulabiliyor mu?
  - [x] Kullanici secimi var mi?
  - [x] Program secimi var mi?
  - [x] Ogrenci numarasi otomatik/manuel mi?
- [x] **/student-profiles/[id]/edit** - Duzenleme calisiyor mu?
  - [x] AcademicStatus degistirilebiliyor mu? (Active, Graduated, vb.)

## B11. Blog Posts CRUD
- [x] **/blog** - Blog yazilari listeleniyor mu?
- [x] **/blog/create** - Yeni yazi olusturulabiliyor mu?
  - [x] Baslik, slug, icerik, ozet alanlari var mi?
  - [x] Kapak gorseli yuklenebiliyor mu?
  - [x] Yayinlanma durumu secimi var mi?
- [x] **/blog/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B12. Gallery CRUD
- [x] **/gallery** - Galeri ogeleri gorunuyor mu?
- [x] **/gallery/create** - Yeni gorsel eklenebiliyor mu?
  - [x] Gorsel yukleme calisiyor mu?
  - [x] Baslik, aciklama alanlari var mi?
- [x] **/gallery/[id]/edit** - Duzenleme calisiyor mu?
- [x] Silme calisiyor mu?

## B13. Users
- [x] **/users** - Kullanici listesi gorunuyor mu?
  - [x] Her satirda isim, email, roller gorunuyor mu?
- [x] **/users/create** - Yeni kullanici olusturulabiliyor mu?
  - [x] Isim, soyisim, email, sifre alanlari var mi?
- [x] **/users/[id]/edit** - Duzenleme calisiyor mu?
- [x] **/users/[id]/roles** - Rol yonetimi calisiyor mu?
  - [x] Rol eklenebiliyor/kaldirilabiliyor mu?

## B14. Enrollments
- [x] **/enrollments** - Kayit listesi gorunuyor mu?
- [x] Istatistik kartlari gorunuyor mu? (Enrolled, Completed, Dropped, Total)
- [x] Filtreler calisiyor mu?
  - [x] Ogrenci arama
  - [x] Durum filtresi (Enrolled/Completed/Dropped)
  - [x] Donem filtresi
- [x] Tablo verisi dogru gorunuyor mu?

## B15. Grades & GPA
- [x] **/grades** - Sayfa aciliyor mu?
- [x] GPA Records tab'i calisiyor mu?
  - [x] Ogrenci arama filtresi calisiyor mu?
  - [x] Donem filtresi calisiyor mu?
  - [x] GPA degerleri renkli gorunuyor mu? (yesil >= 3.0, sari >= 2.0, kirmizi < 2.0)
- [x] Final Grades tab'i calisiyor mu?
  - [x] Course offering secimi calisiyor mu?
  - [x] Secim sonrasi final notlari yukleniyor mu?
  - [x] Harf notu, agirlikli ortalama, not puani gorunuyor mu?
  - [x] Published/Draft durumu gorunuyor mu?

## B16. Transcripts
- [x] **/transcripts** - Sayfa aciliyor mu?
- [x] Istatistik kartlari gorunuyor mu? (Total, Official, Unofficial)
- [x] "Generate Official Transcript" bolumu calisiyor mu?
  - [x] Ogrenci secimi dropdown doluyor mu?
  - [x] Generate butonuna basilinca transkript olusturuluyor mu?
  - [x] Verification code basari mesajinda gorunuyor mu?
- [x] Transkript tablosu dogru gorunuyor mu?
  - [x] ID, Student, Program, Official durumu, Verification Code, Generated tarihi, Generated By
- [x] Silme calisiyor mu?

## B17. Applications
- [x] **/applications** - Basvuru listesi gorunuyor mu?
- [x] Basvuru detaylari gorunuyor mu?
- [x] Durum guncelleme calisiyor mu?

## B18. Audit Logs
- [x] **/audit-logs** - Log kayitlari gorunuyor mu?
- [x] Filtre/arama var mi?

---

# C. STUDENT PORTAL (http://localhost:3001) ✅ TAMAMLANDI

## C1. Giris (Login)
- [x] Login sayfasi aciliyor mu?
- [x] Yanlis sifre ile hata gorunuyor mu?
- [x] Student hesabi ile giris yapilabiliyor mu? (ali.yilmaz@test.gua.edu / Test1234!)
- [x] Faculty hesabi ile giris denendiginde "Students only" hatasi gorunuyor mu?
- [x] Dashboard'a yonlendirme calisiyor mu?

## C2. Dashboard (/dashboard)
- [x] Hosgeldin mesaji gorunuyor mu? (ogrenci adi)
- [x] Istatistik kartlari gorunuyor mu?
- [x] Sidebar navigasyonu calisiyor mu?
- [x] Logout calisiyor mu?
> **BUG:** "Welcome back, !" — isim bos geliyor

## C3. Profile (/profile)
- [x] Ogrenci bilgileri gorunuyor mu? (isim, numara, email, program)
- [x] Bilgiler duzenlenebiliyor mu?
- [x] Sifre degistirme calisiyor mu?
  - [x] Eski sifre + yeni sifre girilip kaydediliyor mu?
> **BUG:** Email, First Name, Last Name, Phone alanlari bos gorunuyor

## C4. Courses (/courses)
- [x] Mevcut dersler listeleniyor mu?
- [x] Donem filtresi calisiyor mu?
- [x] Departman filtresi calisiyor mu?
- [x] Derse kayit olma butonu calisiyor mu?
  - [x] Kayit sonrasi basari mesaji gorunuyor mu?
  - [x] Zaten kayitli olunca uyari gorunuyor mu?
> **BUG (KRITIK):** Derse kayit (Enroll) → POST /api/enrollments 500 Internal Server Error

## C5. My Courses (/my-courses)
- [x] Kayitli dersler listeleniyor mu?
- [x] Her derste ders kodu, isim, fakulte uyesi, durum gorunuyor mu?
- [x] "Drop" butonu calisiyor mu? (ders birakma)
  - [x] Onay dialogu gorunuyor mu?
  - [x] Drop sonrasi listeden kalkiyor mu?

## C6. Materials (/materials)
- [x] Ders materyalleri sayfa gorunuyor mu?
- [x] Kayitli dersler listeleniyor mu?
- [x] Bir derse tiklandiginda materyaller gorunuyor mu?

## C7. Materials Detay (/materials/[courseOfferingId])
- [x] Derse ait materyaller listeleniyor mu?
- [x] Dosya indirme linkleri calisiyor mu?
- [x] Materyal basliklari ve aciklamalari gorunuyor mu?
- [x] Odev gonderme (assignment submission) calisiyor mu?

## C8. Grades (/grades)
- [x] Kayitli derslerin not bilgileri gorunuyor mu?
- [x] Her derste harf notu ve not puani var mi?
- [x] Genel GPA gorunuyor mu?
- [x] Detay sayfasina gidilebiliyor mu?

## C9. Grade Detay (/grades/[enrollmentId])
- [x] Ders icin not bilesenleri gorunuyor mu? (odevler, sinavlar)
- [x] Her bilesenin agirligi ve notu gorunuyor mu?
- [x] Agirlikli ortalama hesabi dogru mu?
- [x] Final notu gorunuyor mu?

## C10. Transcript (/transcript)
- [x] Transkript verisi yukleniyor mu?
- [x] Ogrenci bilgileri gorunuyor mu? (isim, numara, program)
- [x] Donem donem dersler listeleniyor mu?
  - [x] Ders kodu, isim, kredi, harf notu
  - [x] Donem GPA
  - [x] Kumulatif GPA
- [x] Genel ozet gorunuyor mu? (toplam kredi, genel GPA)
- [x] "Generate Official Transcript" butonu calisiyor mu?
  - [x] Mezun degilse hata mesaji gorunuyor mu? ("Only graduated students...")
  - [x] Mezun ise verification code ile basari mesaji gorunuyor mu?

## C11. Transcript History (/transcript/history)
- [x] Gecmis transkriptler listeleniyor mu?
- [x] Her kayitta tarih, tur (Official/Unofficial), verification code gorunuyor mu?
- [x] "Back to Transcript" butonu calisiyor mu?
- [x] Transkript yoksa bos mesaj gorunuyor mu?

---

# D. FACULTY PORTAL (http://localhost:3003) ✅ TAMAMLANDI

## D1. Giris (Login)
- [x] Login sayfasi aciliyor mu?
- [x] Faculty hesabi ile giris yapilabiliyor mu? (prof.smith@test.gua.edu / Test1234!)
- [x] Student hesabi ile giris denendiginde "Faculty only" hatasi gorunuyor mu?
- [x] Dashboard'a yonlendirme calisiyor mu?

## D2. Dashboard (/dashboard)
- [x] Hosgeldin mesaji gorunuyor mu?
- [x] Istatistik kartlari gorunuyor mu?
- [x] Sidebar navigasyonu calisiyor mu?

## D3. Profile (/profile)
- [x] Fakulte uyesi bilgileri gorunuyor mu?
- [x] Bilgiler duzenlenebiliyor mu?
- [x] Sifre degistirme calisiyor mu?

## D4. My Courses (/courses)
- [x] Atanan dersler listeleniyor mu?
- [x] Her derste ders kodu, isim, donem, ogrenci sayisi gorunuyor mu?
- [x] Ders detay sayfasina gidilebiliyor mu?

## D5. Course Detail (/courses/[courseOfferingId])
- [x] Ders bilgileri gorunuyor mu?
- [x] Kayitli ogrenci listesi gorunuyor mu?
- [x] Not bilesenleri (grade components) gorunuyor mu?
  - [x] Bilesenler eklenebiliyor mu? (Quiz, Midterm, Final, vb.)
  - [x] Agirliklar atanabiliyor mu?
> **BUG:** Header'da "Enrollment: 3/40" yaziyor ama asagida "No students enrolled yet" ve "0 enrolled" diyor (celiskili veri)

## D6. Materials (/materials)
- [x] Materyaller sayfasi aciliyor mu?
- [x] Ders secimi calisiyor mu?
- [x] Yeni materyal yuklenebiliyor mu?
  - [x] Dosya secimi calisiyor mu?
  - [x] Baslik ve aciklama girilebiliyor mu?
- [x] Mevcut materyaller listeleniyor mu?
- [x] Materyal silinebiliyor mu?

## D7. Grades (/grades)
- [x] Notlandirma sayfasi aciliyor mu?
- [x] Ders secimi calisiyor mu?
- [x] Secilen ders icin not bilesenlerini gorunuyor mu?

## D8. Grading Detail (/grades/[courseOfferingId])
- [x] Ders icin not bilesenleri gorunuyor mu?
- [x] Not bileseni eklenebiliyor/duzenlenebiliyor mu?
  - [x] Isim, tur (Assignment/Quiz/Midterm/Final), agirlik, max puan
- [x] Ogrenci listesi gorunuyor mu?
- [x] Her ogrenciye not girilebiliyor mu?
- [x] Final not hesaplama (Calculate Finals) calisiyor mu?
- [x] Notlar yayinlanabiliyor mu? (Publish)
> **BUG:** Grade Entry sayfasinda Student Grades tablosu bos — ogrenci satirlari gelmiyor

## D9. Submissions (/grades/submissions/[componentId])
- [x] Odev gonderileri listeleniyor mu?
- [x] Her gonderide ogrenci adi, tarih, dosya gorunuyor mu?
- [x] Not/puan girilebiliyor mu?
- [x] Geri bildirim (feedback) yazilabiliyor mu?

---

# E. CROSS-PORTAL TEST SENARYOLARI

## E1. Tam Kayit Akisi (End-to-End Enrollment) ✅
1. [x] **Admin:** Yeni bir Academic Term olustur
2. [x] **Admin:** Yeni bir Course Offering olustur (mevcut ders + yeni donem)
3. [x] **Student:** /courses sayfasinda yeni dersi gor
4. [x] **Student:** Derse kayit ol (Enroll)
5. [x] **Student:** /my-courses'da dersi gor
6. [x] **Admin:** /enrollments'da yeni kaydi gor
7. [x] **Faculty:** /courses'da yeni dersi gor (eger o fakulte uyesine atanmissa)

## E2. Tam Notlandirma Akisi (End-to-End Grading) ✅
1. [x] **Faculty:** Derse not bilesenleri ekle (Midterm %30, Final %40, Assignment %30)
2. [x] **Faculty:** Ogrencilere not gir
3. [x] **Faculty:** Final not hesapla (Calculate)
4. [x] **Faculty:** Notlari yayinla (Publish)
5. [x] **Student:** /grades'de notu gor
6. [x] **Student:** /grades/[enrollmentId]'de detayli not bilgisini gor
7. [x] **Admin:** /grades'de GPA ve final notlarini gor

## E3. Tam Transkript Akisi (End-to-End Transcript) ✅
1. [x] **Admin:** Ogrencinin AcademicStatus'unu "Graduated" yap
2. [x] **Admin:** /transcripts'den ogrenci icin transkript olustur → verification code al
3. [x] **Student:** /transcript'de transkript verisini gor
4. [x] **Student:** /transcript/history'de olusturulan transkripti gor
5. [x] **Public:** /diploma-inquiry'de verification code ile dogrula
6. [x] **Public:** Yanlis kod ile dene → hata mesaji

## E4. Tam Basvuru Akisi (End-to-End Application) ✅
1. [x] **Public:** /apply sayfasindan basvuru formu doldur ve gonder
2. [x] **Admin:** /applications'da yeni basvuruyu gor
3. [x] **Admin:** Basvuru durumunu guncelle

## E5. Tam Icerik Akisi (End-to-End Content) ✅
1. [x] **Admin:** Yeni blog yazisi olustur (gorsel ile)
2. [x] **Public:** /blog'da yeni yaziyi gor
3. [x] **Public:** /blog/[slug] detay sayfasinda icerigi gor
4. [x] **Admin:** Yeni galeri ogesi ekle
5. [x] **Public:** /gallery'de yeni gorsel gorunsun
6. [x] **Admin:** Fakulte profili olustur/guncelle
7. [x] **Public:** /faculty'de guncel profili gor

## E6. Materyal ve Odev Akisi
1. [x] **Faculty:** Derse materyal yukle
2. [x] **Student:** /materials/[courseOfferingId] sayfasinda materyali gor
3. [x] **Student:** Dosya indirme linkine tikla, dosya insin
4. [x] **Student:** Odev gonder (assignment submission)
5. [x] **Faculty:** /grades/submissions/[componentId]'de gonderiyi gor
6. [x] **Faculty:** Not ve geri bildirim gir
> **NOT:** Geri bildirim (faculty feedback) ozeligi planned feature olarak eklendi. Not girisi calisiyor, yorum alani ileride eklenecek.

## E7. Guvenlik Testleri
- [x] Oturum acmadan admin sayfasina gidildiginde login'e yonlendirme oluyor mu?
- [x] Student hesabi ile admin panel'e giris denenince engelleniyor mu?
- [x] Faculty hesabi ile student portal'a giris denenince engelleniyor mu?
- [x] Token suresi doldugunda otomatik refresh calisiyor mu?
- [x] Logout yapilinca tum localStorage temizleniyor mu?
- [x] Yanlis token ile API cagrisi 401 donuyor mu?

## E8. UI/UX Genel Kontroller
- [x] Tum sayfalarda loading spinner gorunuyor mu? (veri yuklenirken)
- [x] Hata durumlarinda kullaniciya anlamli mesaj gorunuyor mu?
- [x] Basarili islemlerde yesil basari mesaji gorunuyor mu?
- [x] Confirm dialoglari calisiyor mu? (silme islemlerinde)
- [x] Formlar bos gonderildiginde validasyon mesajlari gorunuyor mu?
- [x] Responsive tasarim calisiyor mu? (mobil, tablet, desktop)
- [x] Sidebar'da aktif sayfa vurgulu gorunuyor mu?

---

# H. TESPIT EDILEN BUGLAR

## BUG-1: Student Portal — Dashboard isim bos (ORTA)
- **Konum:** Student Portal > Dashboard
- **Belirti:** "Welcome back, !" — isim bos geliyor
- **Beklenen:** "Welcome back, Ali!"

## BUG-2: Student Portal — Profile alanlari bos (ORTA)
- **Konum:** Student Portal > Profile
- **Belirti:** Email, First Name, Last Name, Phone alanlari bos
- **Beklenen:** Ogrenci bilgileri dolu gelmeli

## BUG-3: Student Portal — Enrollment 500 hatasi (KRITIK)
- **Konum:** Student Portal > Courses > Enroll butonu
- **Belirti:** POST /api/enrollments 500 Internal Server Error
- **Beklenen:** Derse kayit basarili olmali

## BUG-4: Faculty Portal — Course Detail ogrenci sayisi celiskisi (ORTA)
- **Konum:** Faculty Portal > Course Detail
- **Belirti:** Header'da "Enrollment: 3/40" ama asagida "No students enrolled yet" ve "0 enrolled"
- **Beklenen:** Ogrenci listesi dogru gosterilmeli

## BUG-5: Faculty Portal — Grade Entry ogrenci listesi bos (YUKSEK)
- **Konum:** Faculty Portal > Grades > Grade Entry
- **Belirti:** Student Grades tablosu bos, ogrenci satirlari gelmiyor
- **Beklenen:** Kayitli ogrenciler ve notlari gosterilmeli

---

# F. BILINEN SINIRLAMALAR

- PDF transkript olusturma henuz yok (sadece veri gosterimi)
- Sayfalama (pagination) henuz yok - tum veriler tek seferde yukleniyor
- Fakulte profil fotolari placeholder olabilir
- SEO meta taglari eksik olabilir (public site)
- Email bildirimleri Brevo SMTP uzerinden gidiyor (gunluk 300 limit)

---

# G. TEST SIRASINDA NOTLAR

> Her testi yaparken browser DevTools > Network sekmesini acik tutun.
> API cagrilarinin dogru endpoint'e gittigini ve 200/201 donusunu kontrol edin.
> Hata alindiginda Console sekmesinde detayli hata mesajini not edin.
> Her testi Chrome ve bir baska browser'da da deneyin (cross-browser).
