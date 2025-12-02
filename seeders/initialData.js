// seeders/initialData.js
const bcrypt = require("bcryptjs");

// Basitçe ilk admin şifresini hashleyelim
const hashedPassword = bcrypt.hashSync("123", 12);

const seedUsers = [
  {
    username: "admin",
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    username: "test",
    email: "test@gmail.com",
    password: hashedPassword, // Aynı şifre, hashlenmiş
    role: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const seedEvents = [
  {
    title: "Express.js İleri Seviye Workshop",
    slug: "express-js-ileri-seviye-workshop",
    desc: "Express.js ile verimli ve güvenli web uygulamaları geliştirmeyi öğrenin. Middleware, Router ve Güvenlik pratikleri üzerine derinlemesine çalışma.",
    date: new Date(Date.now() + 86400000 * 5), // 5 gün sonra
    location: "Online Webinar",
    quota: 100,
    numOfViews: 45,
    imagePath: "/static/img/default-event.png", // Varsayılan görseli kullanın
    isPublished: true,
    creatorId: 1, // seedUsers[0]'ın ID'si
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Proje Kriterleri Sunumu ve Değerlendirmesi",
    slug: "proje-kriterleri-sunumu",
    desc: "Bu etkinliğimizde, projenin tüm kriterlerini inceleyecek ve uygulanan çözümleri detaylı olarak tartışacağız.",
    date: new Date(Date.now() + 86400000 * 2), // 2 gün sonra
    location: "Ankara Teknokent",
    quota: 50,
    numOfViews: 120,
    imagePath: "/static/img/default-event.png",
    isPublished: true,
    creatorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Diğer seed verileri buraya eklenebilir (Registration, Question vb.)

module.exports = {
  seedUsers,
  seedEvents,
  // Diğer listeler...
};
