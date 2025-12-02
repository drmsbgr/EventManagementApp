// middleware/online_counter.js

const onlineCounter = async (req, res, next) => {
  // req.sessionStore, sequelize-session-store tarafından sağlanır
  if (req.sessionStore && typeof req.sessionStore.length === "function") {
    try {
      // Aktif oturum sayısını çeker
      const count = await req.sessionStore.length();

      // Veriyi tüm EJS şablonlarına (res.locals) aktar
      res.locals.onlineUsersCount = count;
    } catch (error) {
      console.error("Online kullanıcı sayacı hatası:", error);
      res.locals.onlineUsersCount = 0;
    }
  } else {
    // Eğer session store hazır değilse 0 gönder
    res.locals.onlineUsersCount = 0;
  }
  next();
};

module.exports = onlineCounter;
