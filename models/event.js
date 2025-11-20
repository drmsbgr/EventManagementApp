// models/Event.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db"); // Bağlantı nesnesini alıyoruz
const slugify = require("slugify"); // Slugify için paketi dahil ediyoruz

const Event = sequelize.define(
  "Event",
  {
    // 1. Temel Bilgiler (id otomatik eklenecektir)
    title: {
      // başlık
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      // URL için Slugify kriteri
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    desc: {
      // açıklama
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // 2. Zaman ve Mekan
    date: {
      // tarih
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      // konum
      type: DataTypes.STRING,
      allowNull: false,
    },

    // 3. Ek Özellikler ve Kriterler
    quota: {
      // Kayıt sayısını sınırlamak için
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    numOfViews: {
      // Ziyaretçi Sayacı kriteri
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // 4. Resim Galerisi (Tek bir ana resim ve bir dizi resim)
    imagePath: {
      // resim dosya yolu (sunucuda saklanacak)
      type: DataTypes.STRING,
      allowNull: true, // Resim zorunlu olmayabilir
    },
    // İpucu: Resim Galerisi için ayrı bir 'Gallery' modeli kurmak daha iyidir
    // Şimdilik sadece ana resim yolunu tutuyoruz.

    isPublished: {
      // Etkinliğin yayınlanıp yayınlanmadığı
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    // Model ayarları
    tableName: "events",

    // SLUGIFY UYGULAMASI (Kriter)
    hooks: {
      // Bir kayıt oluşturulmadan veya güncellenmeden hemen önce çalışır
      beforeValidate: (event, options) => {
        if (event.title) {
          // Başlık alanını URL dostu bir slug'a dönüştür
          event.slug = slugify(event.title, {
            lower: true, // Küçük harf
            strict: true, // URL'de sorun çıkaracak karakterleri kaldır
            locale: "tr", // Türkçe karakterleri dönüştür (ç->c, ü->u vb.)
          });
        }
      },
    },
  }
);

module.exports = Event;
