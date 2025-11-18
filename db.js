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

    // Tüm modelleri senkronize et (tabloları oluştur/güncelle)
    await sequelize.sync({ alter: true }); // alter: true, mevcut tabloları model değişikliklerine göre günceller
    console.log("Veritabanı Tabloları Senkronize Edildi.");
  } catch (error) {
    console.error("SQLite Bağlantı Hatası:", error);
  }
}

module.exports = { sequelize, connectDB };
