// db.js
const { Sequelize } = require("sequelize");

// Yeni bir Sequelize örneği oluşturuyoruz.
// Parametreler: 'veritabanı_adı', 'kullanıcı_adı', 'şifre'
// Bu durumda SQLite kullandığımız için bunlar önemsizdir.
// 'storage' parametresi, veritabanı dosyasının yolunu belirtir.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./data/appDB.sqlite", // Projemizin data/ klasöründe bu dosya oluşacak
  logging: false, // Konsolda SQL sorgularını göstermeyi kapat
});

// Veritabanı dosyasının tutulacağı klasörü oluşturalım (gerekiyorsa)
const fs = require("fs");
const path = require("path");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Bağlantıyı test etme fonksiyonu
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("SQLite Bağlantısı Başarılı.");
    await sequelize.query("PRAGMA foreign_keys = OFF;");
    // Önceki başarısız sync'lerden kalan backup tablolarını temizle
    await sequelize.query("DROP TABLE IF EXISTS registrations_backup;");
    await sequelize.query("DROP TABLE IF EXISTS sessions_backup;");
    await sequelize.query("DROP TABLE IF EXISTS events_backup;");
    await sequelize.query("DROP TABLE IF EXISTS users_backup;");

    // Tüm modelleri senkronize et (tabloları oluştur/güncelle)
    //await sequelize.sync({ alter: true }); // alter: true, mevcut tabloları model değişikliklerine göre günceller
    console.log("Veritabanı Tabloları Senkronize Edildi.");
  } catch (error) {
    console.error("SQLite Bağlantı Hatası:", error);
  }
}

module.exports = { sequelize, connectDB };
