const path = require("path");
const fs = require("fs");

// YENİ: Multer konfigürasyonunu require et
const upload = require("../config/multer_config");

// Modeller
const Event = require("../models/event");
const Registration = require("../models/registration");
const User = require("../models/user");
const Question = require("../models/question");
const Announcement = require("../models/announcement");

exports.upload = upload;

exports.get_index = (req, res) => {
  res.render("index", {
    title: "Admin Paneli",
    contentPath: "admin/dashboard",
    error: req.session.error,
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
    event: {},
  });
};

exports.get_edit_event = async (req, res) => {
  try {
    const targetEventId = req.params.eventId;

    const event = await Event.findOne({ where: { id: targetEventId } });

    if (!event) {
      return res.render("index", {
        title: "Hata",
        contentPath: "admin/dashboard",
        error: "Etkinlik bulunamadı.",
      });
    }

    res.render("index", {
      title: "Yeni Etkinlik Ekle",
      contentPath: "admin/event_form",
      csrfToken: req.csrfToken(),
      event: event,
    });
  } catch (error) {
    console.error("Etkinlik düzenleme hatası:", error);
    res.render("index", {
      title: "Hata",
      contentPath: "admin/dashboard",
      error: "Etkinlik yüklenemedi.",
    });
  }
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
      imagePath: "/static/uploads/" + event_image.filename, // Public klasörüne göre yolu kaydet
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

exports.post_edit_event = async (req, res) => {
  const targetEventId = req.params.eventId;
  const { title, desc, date, location, quota, isPublished } = req.body;
  const event_image = req.file;
  const isPublishedValue = isPublished === "true";
  try {
    const event = await Event.findOne({ where: { id: targetEventId } });
    if (!event) {
      return res.render("index", {
        title: "Hata",
        contentPath: "admin/dashboard",
        error: "Etkinlik bulunamadı.",
      });
    }

    // Etkinlik bilgilerini güncelle
    event.title = title;
    event.desc = desc;
    event.date = date;
    event.location = location;
    event.quota = quota;
    event.isPublished = isPublishedValue;
    if (event_image) {
      // Yeni resim yüklendiyse eski resmi sil
      if (event.imagePath) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          event.imagePath
        );
        fs.unlink(oldImagePath, (unlinkErr) => {
          if (unlinkErr)
            console.error("Eski dosya silinirken hata oluştu:", unlinkErr);
        });
      }
      event.imagePath = "/uploads/" + event_image.filename;
    }
    await event.save();

    console.log(`Etkinlik güncellendi: ${event.title}`);
    return res.redirect("/admin/events");
  } catch (error) {
    console.error("Etkinlik güncelleme hatası:", error);
    return res.render("index", {
      title: "Hata",
      contentPath: "admin/event_form",
      error: "Etkinlik güncellenirken bir hata oluştu.",
    });
  }
};

exports.post_delete_event = async (req, res) => {
  const { eventId } = req.body;

  try {
    const event = await Event.findOne({ where: { id: eventId } });
    if (!event) {
      return res.render("index", {
        title: "Hata",
        contentPath: "admin/dashboard",
        error: "Etkinlik bulunamadı.",
      });
    }

    //etkinliğe bağlı soruları sil
    // soruları event id ile bul
    const questions = await Question.findAll({ where: { eventId: event.id } });
    // her bir soruyu sil
    for (const question of questions) {
      await question.destroy();
    }

    // Etkinliği sil
    await event.destroy();

    console.log(`Etkinlik silindi: ${event.title}`);
    return res.redirect("/admin/events");
  } catch (error) {
    console.error("Etkinlik silme hatası:", error);
    return res.render("index", {
      title: "Hata",
      contentPath: "admin/dashboard",
      error: "Etkinlik silinirken bir hata oluştu.",
    });
  }
};

//users
exports.get_users = async (req, res) => {
  try {
    // Tüm kullanıcıları çek, şifre hariç
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "ASC"]],
    });

    // Session'da tutulan hata/başarı mesajlarını çek
    const errorMessage = req.session.error;
    const successMessage = req.session.success;
    // Mesajları temizle
    req.session.error = null;
    req.session.success = null;

    res.render("index", {
      title: "Kullanıcı Yönetimi",
      contentPath: "admin/users",
      users: users,
      error: errorMessage,
      success: successMessage,
    });
  } catch (err) {
    console.error("Kullanıcı listesi çekilirken hata:", err);
    req.session.error = "Kullanıcılar yüklenirken bir hata oluştu.";
    res.redirect("/admin");
  }
};

exports.post_user_update_role = async (req, res) => {
  const { userId, newRole } = req.body;
  const currentAdminId = req.session.user.id;

  // Kendi rolünü düzenlemesini engelle (Güvenlik)
  if (parseInt(userId) === currentAdminId) {
    req.session.error = "Kendi yetkinizi bu ekrandan değiştiremezsiniz.";
    return res.redirect("/admin/users");
  }

  // Rolün geçerli olup olmadığını kontrol et
  if (newRole !== "admin" && newRole !== "user") {
    req.session.error = "Geçersiz rol değeri.";
    return res.redirect("/admin/users");
  }

  try {
    const [updatedRows] = await User.update(
      { role: newRole },
      { where: { id: userId } }
    );

    if (updatedRows > 0) {
      req.session.success = `Kullanıcı rolü başarıyla "${newRole.toUpperCase()}" olarak güncellendi.`;
    } else {
      req.session.error = "Kullanıcı bulunamadı veya rol zaten aynıydı.";
    }

    res.redirect("/admin/users");
  } catch (err) {
    console.error("Rol güncelleme hatası:", err);
    req.session.error = "Rol güncellenirken bir hata oluştu.";
    res.redirect("/admin/users");
  }
};

exports.post_user_delete = async (req, res) => {
  const { userId } = req.body;
  const currentAdminId = req.session.user.id;

  // Kendi hesabını silmeyi engelle (Güvenlik)
  if (parseInt(userId) === currentAdminId) {
    req.session.error = "Kendi hesabınızı bu ekrandan silemezsiniz.";
    return res.redirect("/admin/users");
  }

  try {
    // Kullanıcıyı silme işlemi, eğer server.js'teki ilişkilerde
    // "ON DELETE CASCADE" doğru ayarlandıysa, bağlı kayıtları (Registration, Question) da siler.
    const deletedCount = await User.destroy({
      where: { id: userId },
    });

    // Etkinlikler için 'ON DELETE SET NULL' ayarlandığı varsayıldığından,
    // silinen adminin oluşturduğu etkinlikler creatorId=NULL olarak kalır.

    if (deletedCount > 0) {
      req.session.success =
        "Kullanıcı ve tüm ilişkili kayıtları başarıyla silindi. (Cascade)";
    } else {
      req.session.error = "Kullanıcı silinemedi veya bulunamadı.";
    }

    res.redirect("/admin/users");
  } catch (err) {
    console.error("Kullanıcı silme hatası:", err);
    req.session.error = "Kullanıcı silinirken bir hata oluştu.";
    res.redirect("/admin/users");
  }
};

//stats
exports.get_stats = async (req, res) => {
  try {
    // 1. Kritik Metrikleri Çekme
    const totalUsers = await User.count();
    const totalEvents = await Event.count({ where: { isPublished: true } });
    const totalRegistrations = await Registration.count();

    // 2. En Popüler Etkinlikleri Çekme (İlk 5)
    const topEvents = await Event.findAll({
      where: { isPublished: true },
      attributes: ["title", "numOfViews"],
      order: [["numOfViews", "DESC"]],
      limit: 5,
    });

    // 3. Online Kullanıcı Sayısı Simülasyonu (Kriter)
    // Gerçek zamanlı online sayımı karmaşıktır. Basit bir simülasyon yapıyoruz.
    // Bu örnekte, son 15 dakika içinde aktif olan oturumları sayabiliriz.
    // SequelizeStore kullandığımız için session tablosunu sayabiliriz.

    // Bu sorgu, doğrudan SequelizeStore'dan çalışır:
    const onlineUsers = await req.sessionStore.length().catch(() => 0); // Hata olursa 0 döndür

    res.render("index", {
      title: "Sistem İstatistikleri",
      contentPath: "admin/stats",
      stats: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        onlineUsers,
        topEvents,
      },
    });
  } catch (err) {
    console.error("İstatistikler yüklenirken hata:", err);
    req.session.error = "İstatistikler yüklenirken bir hata oluştu.";
    res.redirect("/admin");
  }
};

//announcements
exports.get_announcements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      include: [
        {
          model: User,
          as: "publisher", //view içindeki ad
          attributes: ["username"], // Sadece kullanıcı adını çek
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    req.session.error = null;

    res.render("index", {
      title: "Duyuru Yönetimi",
      contentPath: "admin/announcements",
      announcements: announcements,
    });
  } catch (err) {
    req.session.error = "Duyurular yüklenemedi.";
    res.redirect("/admin");
  }
};

exports.post_announcement = async (req, res) => {
  const { title, content, isPublished } = req.body;

  try {
    await Announcement.create({
      title: title,
      content: content,
      isPublished: isPublished === "on", // Checkbox değeri 'on' gelir
      creatorId: req.session.user.id,
    });

    req.session.success = "Yeni duyuru başarıyla eklendi.";
    res.redirect("/admin/announcements");
  } catch (err) {
    req.session.error = "Duyuru eklenirken hata oluştu.";
    res.redirect("/admin/announcements");
  }
};

exports.get_announcement_edit = async (req, res) => {
  try {
    const announcementId = req.params.announcementId;

    const announcement = await Announcement.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      req.session.error = "Düzenlenecek duyuru bulunamadı.";
      return res.redirect("/admin/announcements");
    }

    res.render("index", {
      title: "Duyuru Düzenle",
      contentPath: "admin/announcement_edit", // Yeni bir EJS dosyası kullanacağız
      announcement: announcement,
      csrfToken: req.csrfToken(),
      error: req.session.error || null,
      success: req.session.success || null,
    });
    req.session.error = null;
    req.session.success = null;
  } catch (err) {
    console.error("Duyuru düzenleme sayfası yükleme hatası:", err);
    req.session.error = "Duyuru bilgileri yüklenirken bir hata oluştu.";
    res.redirect("/admin/announcements");
  }
};

exports.post_announcement_edit = async (req, res) => {
  const announcementId = req.params.announcementId;
  const { title, content, isPublished } = req.body;

  // Checkbox işaretlenmediyse (yayınlama kaldırıldıysa), değeri 'undefined' gelir.
  const isPublishedValue = isPublished === "on";

  try {
    const announcement = await Announcement.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      req.session.error = "Güncellenecek duyuru bulunamadı.";
      return res.redirect("/admin/announcements");
    }

    // Verileri güncelle
    announcement.title = title;
    announcement.content = content;
    announcement.isPublished = isPublishedValue;

    await announcement.save(); // Güncellenmiş veriyi kaydet

    req.session.success = `Duyuru ("${title}") başarıyla güncellendi.`;
    res.redirect("/admin/announcements");
  } catch (err) {
    console.error("Duyuru güncelleme hatası:", err);
    req.session.error = "Duyuru güncellenirken bir hata oluştu.";
    res.redirect(`/admin/announcements/edit/${announcementId}`);
  }
};

exports.post_announcement_delete = async (req, res) => {
  const { announcementId } = req.body;

  try {
    const deletedRows = await Announcement.destroy({
      where: { id: announcementId },
    });

    if (deletedRows > 0) {
      req.session.success = "Duyuru başarıyla silindi.";
    } else {
      req.session.error = "Silinecek duyuru bulunamadı.";
    }

    res.redirect("/admin/announcements");
  } catch (err) {
    console.error("Duyuru silme hatası:", err);
    req.session.error = "Duyuru silinirken bir hata oluştu.";
    res.redirect("/admin/announcements");
  }
};
