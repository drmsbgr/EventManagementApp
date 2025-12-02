const express = require("express");
const controller = require("../controllers/eventController");
const authMiddleware = require("../middleware/is_auth");
const csrf = require("../middleware/csrf");
const router = express.Router();

// Ziyaretçi Sayacı için Oturum Kontrolü Middleware'i
const trackPageView = (req, res, next) => {
  // 1. Görüntülenen etkinlikleri tutacak session dizisini başlat
  if (!req.session.viewedEvents) {
    req.session.viewedEvents = [];
  }

  // 2. Rotadaki slug'ı al
  const slug = req.params.slugName;

  // 3. Kontrol: Eğer bu etkinlik bu oturumda daha önce görülmediyse
  if (!req.session.viewedEvents.includes(slug)) {
    // Etkinlik slug'ını listeye ekle
    req.session.viewedEvents.push(slug);

    // Veritabanı güncellemesi için bayrağı ayarla
    req.isNewView = true;

    // ÖNEMLİ: SequelizeStore gibi harici depolama kullanırken
    // oturumun güncellendiğini manuel olarak belirtmek daha güvenli olabilir
    req.session.save((err) => {
      if (err) console.error("Oturum kaydetme hatası:", err);
      next(); // Kaydetme işleminden sonra devam et
    });
  } else {
    // Zaten görülmüş, sayacı artırma
    req.isNewView = false;
    next();
  }
};

router.get("/", csrf, controller.get_events);
router.get("/:slugName", csrf, trackPageView, controller.get_event_details);
router.post(
  "/:slugName/comment",
  authMiddleware,
  controller.post_event_comment
);

module.exports = router;
