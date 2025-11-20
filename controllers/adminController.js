const path = require("path");
const fs = require("fs");

// Modeller
const Event = require("../models/event");
const User = require("../models/user");

// --- MULTER AYARLARI ---
const multer = require("multer");

// Hedef klasörün varlığını kontrol et ve oluştur
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Depolama ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Dosyalar public/uploads içine kaydedilecek
  },
  filename: (req, file, cb) => {
    // Dosya adı: baslik-slug-timestamp.jpg
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Max 5MB dosya boyutu
  fileFilter: (req, file, cb) => {
    // Sadece resim dosyalarına izin ver
    if (!file.mimetype.startsWith("image")) {
      return cb(new Error("Lütfen sadece resim dosyası yükleyin."), false);
    }
    cb(null, true);
  },
});
// -----------------------

exports.upload = upload;

exports.get_index = (req, res) => {
  res.render("index", {
    title: "Admin Paneli",
    contentPath: "admin/dashboard",
    csrfToken: req.csrfToken(),
  });
};

exports.get_events = async (req, res) => {
  try {
    // Tüm etkinlikleri veritabanından çek
    const events = await Event.findAll({
      // Etkinliği kimin oluşturduğunu (Creator) da çekebiliriz
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["username"],
        },
      ],
      order: [["date", "DESC"]], // En yeni etkinlikler üstte olsun
    });

    res.render("index", {
      title: "Etkinlik Yönetimi",
      contentPath: "admin/event_list",
      events: events, // Etkinlik listesini EJS'e gönder
      csrfToken: req.csrfToken(),
    });
  } catch (err) {
    console.error("Etkinlik listesi çekilirken hata:", err);
    res.render("index", {
      title: "Hata",
      contentPath: "admin/dashboard",
      error: "Etkinlikler yüklenemedi.",
    });
  }
};

exports.get_create_event = (req, res) => {
  res.render("index", {
    title: "Yeni Etkinlik Ekle",
    contentPath: "admin/event_form",
    csrfToken: req.csrfToken(),
    // Form verilerini düzenleme modunda olmadığı için boş gönderiyoruz
  });
};

exports.post_create_event = async (req, res) => {
  const { title, desc, date, location, quota, isPublished } = req.body;
  const event_image = req.file;
  const isPublishedValue = isPublished === "true";

  if (!event_image) {
    // Eğer resim yüklenmediyse ve zorunluysa hata ver
    // İleride daha detaylı hata yönetimi yapılabilir
    return res.redirect("/admin/events/create");
  }

  try {
    // Etkinliği veritabanına kaydet
    const newEvent = await Event.create({
      title: title,
      desc: desc,
      date: date,
      location: location,
      quota: quota,
      imagePath: "/uploads/" + event_image.filename, // Public klasörüne göre yolu kaydet
      isPublished: isPublishedValue,
      creatorId: req.session.user.id, // Oturumdaki kullanıcının ID'sini kullan
    });

    console.log(`Yeni etkinlik oluşturuldu: ${newEvent.title}`);

    // Başarılı olursa etkinlik listesine yönlendir
    return res.redirect("/admin/events");
  } catch (err) {
    console.error("Etkinlik oluşturma hatası:", err);

    // Hata durumunda yüklenen dosyayı sil
    if (event_image) {
      fs.unlink(event_image.path, (unlinkErr) => {
        if (unlinkErr)
          console.error("Dosya silinirken hata oluştu:", unlinkErr);
      });
    }

    // Hata mesajı ile formu yeniden göster
    return res.render("index", {
      title: "Hata",
      contentPath: "admin/event_form",
      error:
        "Etkinlik kaydedilirken bir hata oluştu (Örn: Başlık zaten mevcut).",
    });
  }
};
