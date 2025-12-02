// middleware/ip_tracker.js
const { connectDB, sequelize } = require("../db");
const OnlineVisitor = require("../models/OnlineVisitor");

// Etkili bir IP adresi çekme fonksiyonu
const getClientIp = (req) => {
  // Eğer proxy kullanıyorsanız (örneğin Heroku, Nginx) 'x-forwarded-for' kullanılır.
  // Yoksa doğrudan req.ip kullanılır.
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.ip;
};

const ipTracker = async (req, res, next) => {
  const ip = getClientIp(req);
  const now = new Date();

  try {
    // 1. Kaydı Bul veya Oluştur
    const [visitor, created] = await OnlineVisitor.findOrCreate({
      where: { ipAddress: ip },
      defaults: { lastActive: now },
    });

    // 2. Eğer kayıt mevcutsa, sadece lastActive zamanını güncelle
    if (!created) {
      await visitor.update({ lastActive: now });
    }

    // 3. Online kullanıcı sayısını hesapla ve locals'a ekle
    // Son 5 dakika içinde aktif olan IP'leri say (Bu 'online' tanımımız olsun)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const onlineCount = await OnlineVisitor.count({
      where: { lastActive: { [sequelize.Sequelize.Op.gte]: fiveMinutesAgo } },
    });

    res.locals.onlineUsersCount = onlineCount;
  } catch (error) {
    console.error("IP Takip Hatası:", error);
    res.locals.onlineUsersCount = 0;
  }

  next();
};

module.exports = ipTracker;
