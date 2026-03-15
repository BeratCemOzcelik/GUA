# 📚 Global University America - Admin Panel Dokümantasyonu

## 🎯 Genel Bakış

GUA Admin Panel, üniversitenin tüm akademik ve operasyonel süreçlerini yöneten merkezi kontrol panelidir. Bu sistem, manuel işlemleri otomatikleştirerek verimliliği artırır ve profesyonel bir yönetim deneyimi sunar.

---

## 📊 Sayfalar ve İşlevleri

### 1. 📊 **Dashboard (Ana Sayfa)**

**Ne İşe Yarar:**
- Admin paneline giriş yapıldığında ilk görülen sayfa
- Sistemin genel durumunu görselleştirir
- Hızlı istatistikler ve özet bilgiler sunar

**Gösterdiği Veriler:**
- Toplam öğrenci sayısı
- Toplam ders sayısı
- Toplam program sayısı
- Son eklenen kayıtlar
- Sistem durumu

**Kimler Kullanır:** Admin, SuperAdmin

---

### 2. 🏢 **Departments (Bölümler)**

**Ne İşe Yarar:**
- Üniversitenin akademik bölümlerini yönetir
- Bölüm bilgilerini saklar ve düzenler

**Örnek Bölümler:**
- Computer Science (Bilgisayar Bilimleri)
- Business Administration (İşletme)
- Engineering (Mühendislik)
- Psychology (Psikoloji)

**Alanlar:**
- `Name`: Bölüm adı
- `Code`: Kısa kod (örn: CS, BA, ENG)
- `Description`: Bölüm açıklaması
- `Is Active`: Aktif/pasif durumu

**İlişkiler:**
- ✅ **Programs** → Her bölüm altında birden fazla program olabilir
- ✅ **Courses** → Her bölüm altında dersler tanımlanır
- ✅ **Faculty** → Öğretim üyeleri bölümlere atanır

**Kimler Kullanır:** Admin, SuperAdmin

---

### 3. 🎓 **Programs (Akademik Programlar)**

**Ne İşe Yarar:**
- Üniversitenin sunduğu lisans, yüksek lisans ve doktora programlarını tanımlar
- Mezuniyet gereksinimlerini belirler

**Program Türleri:**
- Bachelor (Lisans) - 4 yıl
- Master (Yüksek Lisans) - 2 yıl
- Doctoral (Doktora) - 4-6 yıl

**Örnek Programlar:**
- Bachelor of Science in Computer Science (CS Bölümü altında)
- Master of Business Administration (İşletme Bölümü altında)
- Doctoral in Psychology (Psikoloji Bölümü altında)

**Alanlar:**
- `Name`: Program adı
- `Department`: Hangi bölüme ait
- `Degree Type`: Bachelor/Master/Doctoral
- `Total Credits Required`: Mezuniyet için gereken kredi (örn: 120)
- `Duration Years`: Program süresi (örn: 4 yıl)
- `Description`: Program açıklaması
- `Requirements`: Kabul gereksinimleri
- `Tuition Fee`: Öğrenim ücreti

**İlişkiler:**
- ⬆️ **Department** → Her program bir bölüme aittir
- ⬇️ **Students** → Öğrenciler bir programa kayıt olur
- ↔️ **Courses** → Programda alınması gereken dersler

**Kimler Kullanır:** Admin, SuperAdmin

---

### 4. 📚 **Courses (Dersler)**

**Ne İşe Yarar:**
- Üniversitede verilen tüm dersleri tanımlar
- Ders içeriklerini ve gereksinimlerini yönetir

**Örnek Dersler:**
- CS101 - Introduction to Programming
- BA201 - Financial Accounting
- PSY301 - Cognitive Psychology

**Alanlar:**
- `Course Code`: Ders kodu (örn: CS101)
- `Name`: Ders adı
- `Department`: Hangi bölüme ait
- `Credits`: Kredi değeri (örn: 3 kredi)
- `Description`: Ders açıklaması
- `Syllabus`: Müfredat
- `Prerequisites`: Ön koşul dersler

**İlişkiler:**
- ⬆️ **Department** → Her ders bir bölüme aittir
- ⬇️ **Course Materials** → Ders materyalleri bu derslerle ilişkilidir
- ⬇️ **Course Offerings** → Dönemlik açılan ders bölümleri
- ↔️ **Programs** → Programların müfredatında yer alır

**Kimler Kullanır:** Admin, SuperAdmin

---

### 5. 📅 **Academic Terms (Akademik Dönemler)**

**Ne İşe Yarar:**
- Akademik takvimi yönetir
- Dönem başlangıç/bitiş tarihlerini belirler
- Kayıt dönemlerini kontrol eder

**Örnek Dönemler:**
- Fall 2026 (Güz 2026)
- Spring 2027 (Bahar 2027)
- Summer 2027 (Yaz 2027)

**Alanlar:**
- `Name`: Dönem adı (örn: Fall 2026)
- `Code`: Dönem kodu (örn: FALL2026)
- `Start Date`: Dönem başlangıç tarihi
- `End Date`: Dönem bitiş tarihi
- `Enrollment Start Date`: Kayıt başlangıç tarihi
- `Enrollment End Date`: Kayıt bitiş tarihi
- `Is Active`: Aktif dönem mi?

**İlişkiler:**
- ⬇️ **Course Offerings** → Her dönemde açılan ders bölümleri
- ⬇️ **Enrollments** → Öğrencilerin dönemlik kayıtları
- ⬇️ **GPA Records** → Dönemlik GPA kayıtları

**Workflow:**
```
1. Admin yeni dönem oluşturur (örn: Fall 2026)
2. Enrollment dates belirlenir (kayıt dönemi)
3. Faculty, dönem için ders bölümleri açar (Course Offerings)
4. Öğrenciler kayıt döneminde derslere yazılır
5. Dönem başlar, dersler verilir
6. Notlar girilir
7. Dönem biter, GPA hesaplanır
```

**Kimler Kullanır:** Admin, SuperAdmin

---

### 6. 📄 **Course Materials (Ders Materyalleri)**

**Ne İşe Yarar:**
- Ders notları, sunumlar, ödevler gibi materyalleri yönetir
- Faculty tarafından yüklenen dosyaları saklar
- Öğrencilerin erişimine sunar

**Örnek Materyaller:**
- CS101 - Week 1 Lecture Notes.pdf
- BA201 - Financial Statements Template.xlsx
- PSY301 - Midterm Study Guide.docx

**Alanlar:**
- `Course`: Hangi derse ait
- `Course Offering`: Hangi dönemlik ders bölümüne ait (opsiyonel)
- `Title`: Materyal başlığı
- `Description`: Materyal açıklaması
- `File`: Yüklenen dosya (PDF, Word, PowerPoint, vs.)
- `File Type`: Dosya tipi
- `Version`: Versiyon numarası
- `Uploaded By`: Kimin yüklediği
- `Is Active`: Aktif/pasif

**İlişkiler:**
- ⬆️ **Course** → Her materyal bir derse aittir
- ⬆️ **Faculty** → Öğretim üyeleri materyal yükler
- ⬆️ **Course Offering** → Belirli bir dönemlik ders bölümüne özel olabilir

**Workflow:**
```
1. Faculty üyesi dersi için materyal yükler
2. Materyal Course Materials'a kaydedilir
3. Öğrenciler Student Portal'dan materyale erişir
4. Faculty gerektiğinde materyal güncelleyebilir (version artar)
```

**Kimler Kullanır:**
- **Yükleyen:** Faculty
- **Yöneten:** Admin, SuperAdmin
- **Görüntüleyen:** Students (Student Portal'dan)

---

### 7. 👨‍🏫 **Faculty Profiles (Öğretim Üyesi Profilleri)**

**Ne İşe Yarar:**
- Öğretim üyelerinin akademik profillerini oluşturur
- Öğrencilere ve ziyaretçilere öğretim üyeleri hakkında bilgi sunar
- Public website'de görüntülenir

**Alanlar:**
- `User`: Hangi kullanıcıya ait (Faculty rolü olmalı)
- `Title`: Unvan (Prof., Assoc. Prof., Asst. Prof., Dr.)
- `Photo`: Profil fotoğrafı
- `Bio`: Biyografi
- `Research Interests`: Araştırma alanları
- `Office Location`: Ofis konumu
- `Office Hours`: Ofis saatleri
- `LinkedIn URL`: LinkedIn profili
- `Google Scholar URL`: Google Scholar profili

**İlişkiler:**
- ⬆️ **User** → Her profile bir kullanıcıya (Faculty rolü) aittir
- ⬆️ **Department** → Öğretim üyesi bir bölüme bağlıdır
- ⬇️ **Course Offerings** → Öğretim üyesi dersleri verir
- ⬇️ **Course Materials** → Öğretim üyesi materyal yükler

**Kullanım Senaryosu:**
```
1. Admin, Users sayfasından Faculty rolüyle kullanıcı oluşturur
2. Faculty Profiles'dan bu kullanıcı için profil oluşturur
3. Profil bilgileri ve fotoğraf eklenir
4. Public website'de "Our Faculty" sayfasında görüntülenir
5. Öğrenciler öğretim üyelerinin bilgilerine erişir
```

**Kimler Kullanır:**
- **Oluşturan/Yöneten:** Admin, SuperAdmin
- **Görüntüleyen:** Herkes (Public Website'de)

---

### 8. ✍️ **Blog Posts (Blog Yazıları)**

**Ne İşe Yarar:**
- Üniversite haberlerini, duyurularını ve makalelerini yönetir
- Public website'de blog bölümünü besler
- SEO için önemli içerik sağlar

**Örnek Blog Yazıları:**
- "Welcome to Fall 2026 Semester"
- "New Computer Science Laboratory Opening"
- "Student Success Story: John Doe"

**Alanlar:**
- `Title`: Yazı başlığı
- `Slug`: URL dostu başlık (örn: welcome-fall-2026)
- `Content`: Yazı içeriği (Markdown destekli)
- `Featured Image`: Kapak görseli
- `Author`: Yazan kişi
- `Published At`: Yayın tarihi
- `Is Published`: Yayında mı?

**İlişkiler:**
- ⬆️ **User** → Yazar (Admin kullanıcısı)
- ↔️ **Public Website** → Blog sayfasında görüntülenir

**Workflow:**
```
1. Admin yeni blog yazısı oluşturur
2. Featured image yüklenir (drag & drop)
3. İçerik yazılır (Markdown)
4. Slug otomatik oluşturulur (veya manuel düzenlenir)
5. "Publish Immediately" işaretlenir veya taslak bırakılır
6. Yayınlanan yazı public website'de görünür
```

**Kimler Kullanır:**
- **Oluşturan:** Admin, SuperAdmin
- **Görüntüleyen:** Herkes (Public Website'de)

---

### 9. 🖼️ **Gallery (Galeri)**

**Ne İşe Yarar:**
- Üniversite kampüsü, etkinlikler ve öğrenci hayatı fotoğraflarını yönetir
- Public website'de galeri bölümünü besler
- Görsel içerik sağlar

**Örnek Kategoriler:**
- Campus (Kampüs)
- Events (Etkinlikler)
- Students (Öğrenciler)
- Graduation (Mezuniyet)

**Alanlar:**
- `Title`: Resim başlığı
- `Image`: Yüklenen resim
- `Description`: Açıklama
- `Category`: Kategori
- `Display Order`: Görüntülenme sırası

**İlişkiler:**
- ↔️ **Public Website** → Galeri sayfasında görüntülenir

**Workflow:**
```
1. Admin Gallery'e gider
2. "Add Gallery Image" butonuna tıklar
3. Resim yüklenir (drag & drop)
4. Başlık, açıklama ve kategori girilir
5. Display order belirlenir (düzen için)
6. Resim public website'de görünür
```

**Kimler Kullanır:**
- **Oluşturan:** Admin, SuperAdmin
- **Görüntüleyen:** Herkes (Public Website'de)

---

### 10. 👥 **Users (Kullanıcılar)**

**Ne İşe Yarar:**
- Sistem kullanıcılarını yönetir
- Rol atamaları yapar
- Kullanıcı izinlerini kontrol eder

**Roller:**
- `SuperAdmin`: Tüm yetkilere sahip
- `Admin`: Yönetim yetkisi
- `Faculty`: Öğretim üyesi
- `Student`: Öğrenci

**Alanlar:**
- `First Name`: Ad
- `Last Name`: Soyad
- `Email`: Email (login için)
- `Password`: Şifre (hash'lenerek saklanır)
- `Roles`: Kullanıcı rolleri (birden fazla olabilir)
- `Is Active`: Aktif/pasif

**Rol İlişkileri:**
```
SuperAdmin/Admin:
  ✅ Admin Panel'e erişebilir
  ✅ Tüm yönetim işlemlerini yapabilir

Faculty:
  ✅ Faculty Portal'e erişebilir
  ✅ Ders materyali yükleyebilir
  ✅ Not girebilir
  ✅ Faculty Profile'a sahip olabilir

Student:
  ✅ Student Portal'e erişebilir
  ✅ Derslere kayıt olabilir
  ✅ Notlarını görüntüleyebilir
  ✅ Materyal indirebilir
```

**Workflow:**
```
1. Admin Users sayfasına gider
2. Kullanıcıyı listede bulur
3. "Manage Roles" butonuna tıklar
4. İstediği rolleri seçer (örn: Faculty + Admin)
5. "Update Roles" ile kaydeder
6. Kullanıcı artık seçilen rollerin yetkilerine sahip
```

**Kimler Kullanır:** Admin, SuperAdmin

---

## 🔗 Sayfa İlişkileri ve Data Flow

### Akademik Hiyerarşi:
```
Departments (Bölümler)
    ↓
Programs (Programlar)
    ↓
Courses (Dersler)
    ↓
Course Materials (Ders Materyalleri)
```

### Dönemsel Workflow:
```
Academic Terms (Dönemler)
    ↓
Course Offerings (Dönemlik Ders Açılışları)
    ↓
Enrollments (Öğrenci Kayıtları)
    ↓
Grades (Notlar)
    ↓
GPA Records (Dönemlik GPA)
```

### İnsan İlişkileri:
```
Users (Kullanıcılar)
    ↓
    ├─ Faculty Role → Faculty Profiles
    │                       ↓
    │                  Course Offerings (Ders Verir)
    │                       ↓
    │                  Course Materials (Materyal Yükler)
    │
    └─ Student Role → Student Profile
                           ↓
                      Enrollments (Derslere Kayıt)
                           ↓
                      Grades (Notlar Alır)
```

---

## 📋 Tipik İş Akışları

### 1. Yeni Akademik Yıl Hazırlığı:
```
1. Departments → Bölümleri gözden geçir/güncelle
2. Programs → Programları gözden geçir/güncelle
3. Courses → Yeni dersler ekle, müfredat güncelle
4. Academic Terms → Yeni dönem oluştur (örn: Fall 2026)
5. Users → Faculty kullanıcıları ekle
6. Faculty Profiles → Yeni öğretim üyeleri için profil oluştur
```

### 2. Dönem Başlangıcı:
```
1. Academic Terms → Aktif dönemi seç
2. Course Offerings → Faculty, dönem için ders bölümleri açar
3. Students → Kayıt döneminde derslere yazılır (Student Portal)
4. Course Materials → Faculty, ders materyallerini yükler
```

### 3. Dönem Sonu:
```
1. Faculty Portal → Notlar girilir
2. Grades → Final notları yayınlanır
3. GPA Calculation → Otomatik GPA hesaplanır
4. Transcripts → Transkriptler oluşturulur
5. Graduation Audit → Mezuniyet uygunluğu kontrol edilir
```

### 4. Web İçeriği Yönetimi:
```
1. Blog Posts → Haberler ve duyurular yayınlanır
2. Gallery → Etkinlik fotoğrafları eklenir
3. Faculty Profiles → Yeni öğretim üyeleri profilleri public'te görünür
4. Public Website → Tüm içerik otomatik güncellenir
```

---

## 🎯 Her Sayfanın Önemi

| Sayfa | Kritiklik | Kullanım Sıklığı | Bağımlılık |
|-------|-----------|------------------|------------|
| **Users** | 🔴 Çok Yüksek | Her gün | Temel |
| **Departments** | 🟠 Yüksek | Nadiren | Temel |
| **Programs** | 🟠 Yüksek | Nadiren | Departments |
| **Courses** | 🟠 Yüksek | Sık | Departments |
| **Academic Terms** | 🔴 Çok Yüksek | Dönemlik | Temel |
| **Course Materials** | 🟡 Orta | Sık | Courses, Faculty |
| **Faculty Profiles** | 🟡 Orta | Nadiren | Users |
| **Blog Posts** | 🟢 Düşük | Haftalık | Bağımsız |
| **Gallery** | 🟢 Düşük | Aylık | Bağımsız |

---

## 💡 Best Practices

### Sıralama Önerisi (Yeni Kurulum):
1. ✅ **Users** → İlk olarak admin ve faculty kullanıcıları oluşturun
2. ✅ **Departments** → Bölümleri tanımlayın
3. ✅ **Programs** → Akademik programları ekleyin
4. ✅ **Courses** → Dersleri tanımlayın
5. ✅ **Academic Terms** → İlk dönemi oluşturun
6. ✅ **Faculty Profiles** → Öğretim üyesi profillerini ekleyin
7. ✅ **Blog Posts** → İlk blog yazısını yayınlayın
8. ✅ **Gallery** → Kampüs fotoğraflarını ekleyin
9. ✅ **Course Materials** → Faculty, materyal yükleyebilir

### Veri Bütünlüğü:
- ❌ Department silinirse, o bölüme ait Programs ve Courses etkilenir
- ❌ Course silinirse, Course Materials ve Enrollments etkilenir
- ❌ User silinirse, Faculty Profile ve Course Offerings etkilenir

---

## 🚀 Hızlı Başlangıç

### İlk Kurulum Adımları:

1. **Giriş Yapın**
   ```
   URL: http://localhost:3001
   Email: admin@gua.edu.pl
   Password: [admin şifresi]
   ```

2. **İlk Bölümü Oluşturun**
   - Sidebar → Departments → Add Department
   - Örnek: Computer Science (CS)

3. **İlk Programı Ekleyin**
   - Sidebar → Programs → Add Program
   - Örnek: Bachelor of Science in Computer Science
   - Department: Computer Science seçin

4. **İlk Dersi Tanımlayın**
   - Sidebar → Courses → Add Course
   - Örnek: CS101 - Introduction to Programming
   - Department: Computer Science seçin

5. **İlk Dönemi Oluşturun**
   - Sidebar → Academic Terms → Create Term
   - Örnek: Fall 2026

6. **Faculty Kullanıcısı Ekleyin**
   - Sidebar → Users → User listesinde "Manage Roles"
   - Faculty rolünü seçin

7. **Faculty Profile Oluşturun**
   - Sidebar → Faculty Profiles → Add Faculty Profile
   - Yukarıda oluşturduğunuz faculty kullanıcısını seçin

---

## 📞 Destek ve Yardım

Herhangi bir sorunuz veya sorununuz olduğunda:
- 📧 Email: support@gua.edu.pl
- 📚 Dokümantasyon: Bu dosya
- 🐛 Bug Report: GitHub Issues

---

**Son Güncelleme:** 21 Şubat 2026
**Versiyon:** 1.0
**Hazırlayan:** GUA Development Team
