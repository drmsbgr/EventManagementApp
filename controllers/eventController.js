const { Op } = require("sequelize");
const Event = require("../models/event");
const Question = require("../models/question");
const User = require("../models/user");
const Registration = require("../models/registration");

exports.get_events = async (req, res) => {
  try {
    let { q, date, location } = req.query; // Sorgu parametrelerini al

    q = q ? q.trim() : null;
    location = location ? location.trim() : null;

    const filterConditions = {}; // Sequelize where koşulları için nesne

    // 1. Yayınlanmış olma koşulu (Her zaman aktif)
    filterConditions.isPublished = true;

    // 2. Anahtar Kelime (Başlık Arama) Filtresi
    if (q) {
      // Başlıkta anahtar kelimeyi büyük/küçük harf duyarsız ara (PostgreSQL/MySQL için iLike/Like)
      filterConditions.title = { [Op.like]: `%${q}%` };
    }

    // 3. Konum Filtresi
    if (location) {
      // Konumda anahtar kelimeyi büyük/küçük harf duyarsız ara
      filterConditions.location = { [Op.like]: `%${location}%` };
    }

    // 4. Tarih Aralığı Filtresi
    if (date) {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      switch (date) {
        case "today": // Bugün
          filterConditions.date = { [Op.between]: [startOfDay, endOfDay] };
          break;
        case "week": // Bu Hafta (Örn: Bu haftanın başlangıcından sonuna kadar)
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(
            startOfDay.getDate() -
              startOfDay.getDay() +
              (startOfDay.getDay() === 0 ? -6 : 1)
          ); // Pazartesi'den başla
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          filterConditions.date = { [Op.between]: [startOfWeek, endOfWeek] };
          break;
        case "month": // Bu Ay
          const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0
          );
          const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          filterConditions.date = { [Op.between]: [startOfMonth, endOfMonth] };
          break;
        case "future": // Gelecek Etkinlikler (Şu andan itibaren)
          filterConditions.date = { [Op.gt]: now }; // Greater Than (Şu andan büyük)
          break;
        // Tüm Tarihler seçeneği için özel bir şey yapmaya gerek yok, koşul eklenmez.
      }
    }

    //console.log(filterConditions);

    // Etkinlikleri filtre koşullarına göre çek
    const events = await Event.findAll({
      where: filterConditions, // Dinamik olarak oluşturulan koşulları kullan
      order: [["date", "ASC"]], // En yakın tarihtekiler üstte
    });

    res.render("index", {
      title: "Tüm Etkinlikler",
      contentPath: "events",
      events: events,
      // EJS'de filtre değerlerini korumak için gönderiyoruz
      filters: { q: q || "", date: date || "", location: location || "" },
    });
  } catch (error) {
    console.error("Tüm etkinlikleri yükleme hatası:", error);
    res.render("index", {
      title: "Hata",
      contentPath: "events",
      events: [],
      csrfToken: req.csrfToken(),
      error: "Etkinlikler yüklenirken bir hata oluştu.",
      filters: req.query, // Hata durumunda da filtreleri göndermek iyi bir uygulamadır
    });
  }
};

exports.get_event_details = async (req, res) => {
  const slugName = req.params.slugName;

  try {
    const event = await Event.findOne({
      where: { slug: slugName, isPublished: true },
      include: [
        {
          model: Question,
          as: "eventQuestions", // Event modelindeki as adını kullanıyoruz
          required: false, // Soru olmasa bile etkinliği getir
          include: [
            {
              model: User,
              as: "asker", // Question modelindeki as adını kullanıyoruz
              attributes: ["username"], // Sadece kullanıcı adını çek
            },
          ],
          order: [["createdAt", "DESC"]], // Soruları en yeniden eskiye sırala
        },
      ],
    });

    const numOfParticipants = await Registration.count({
      where: {
        eventId: event.id,
      },
    });

    if (!event) {
      console.error("Etkinlik bulunamadı:", slugName);
      return res.status(404).render("index", {
        title: "Etkinlik Bulunamadı",
        contentPath: "event_details",
        csrfToken: req.csrfToken(),
        error: "Aradığınız etkinlik bulunamadı.",
      });
    }

    // ZİYARETÇİ SAYACINI ARTIR
    if (req.isNewView) {
      // Veritabanında numOfViews alanını 1 artır
      await Event.update(
        { numOfViews: event.numOfViews + 1 },
        { where: { id: event.id } }
      );
      // EJS'e gönderilen objeyi de güncelle
      event.numOfViews += 1;
    }

    //veritabanında kullanıcının bu etkinliğe kayıtlı olup olmadığını kontrol etme

    let isRegistered = false;

    if (res.locals.isAuthenticated) {
      var foundReg = await Registration.findOne({
        where: { eventId: event.id, userId: req.session.user.id },
      });

      isRegistered = foundReg ? true : false;
    }

    res.render("index", {
      title: event.title,
      contentPath: "event_details",
      event: event,
      isRegistered: isRegistered,
      numOfParticipants: numOfParticipants,
      error: null,
    });
  } catch (error) {
    console.error("Etkinlik detayları yükleme hatası:", error);
    return res.render("index", {
      title: "Hata",
      contentPath: "event_details",
      csrfToken: req.csrfToken(),
      error: "Etkinlik detayları yüklenirken bir hata oluştu.",
    });
  }
};

exports.post_event_comment = async (req, res) => {
  const { questionText } = req.body;
  const slug = req.params.slugName;

  try {
    // 1. Etkinliği slug ile bul
    const event = await Event.findOne({ where: { slug: slug } });

    if (!event) {
      req.session.error = "Etkinlik bulunamadı.";
      return res.redirect("/");
    }

    // 2. Yeni soruyu veritabanına kaydet
    await Question.create({
      questionText: questionText,
      userId: req.session.user.id, // Oturumdaki kullanıcı ID'si
      eventId: event.id, // Bulunan etkinlik ID'si
    });

    req.session.success = "Sorunuz başarıyla gönderildi!";

    // Başarılıysa detay sayfasına geri dön
    return res.redirect(`/events/${slug}`);
  } catch (err) {
    console.error("Soru gönderme hatası:", err);
    req.session.error = "Soru gönderilirken bir hata oluştu.";
    return res.redirect(`/events/${slug}`);
  }
};
