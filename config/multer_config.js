const path = require("path");
const fs = require("fs");
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
    // Dosya adı: uniqueSuffix.jpg
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
      // Hata mesajını req.session'a kaydetmek isterseniz:
      // req.session.error = "Lütfen sadece resim dosyası yükleyin.";
      return cb(new Error("Lütfen sadece resim dosyası yükleyin."), false);
    }
    cb(null, true);
  },
});

// Multer instance'ını dışarı aktarıyoruz
module.exports = upload;
