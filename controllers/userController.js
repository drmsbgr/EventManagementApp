const Registration = require("../models/registration");
const Event = require("../models/event");

exports.post_user_register_event = async (req, res) => {
  const targetEventSlug = req.body.eventSlug;
  const targetUserId = req.session.user.id;
  const targetEventId = req.params.eventId;

  try {
    const targetEvent = await Event.findOne({ where: { id: targetEventId } });
    const participants = await Registration.count({
      where: { eventId: targetEventId },
    });

    //doldu mu?
    if (participants == targetEvent.quota) {
      console.log("dolu bir etkinliğe katılamazsınız!");
      req.session.error = "Kontenjan dolu!";
      res.redirect(`/events/${targetEvent.slug}`);
    }

    // Yeni kayıt oluştur
    await Registration.create({
      userId: targetUserId,
      eventId: targetEventId,
    });

    // Kayıt başarılıysa kullanıcıyı etkinlik detay sayfasına yönlendir
    res.redirect(`/events/${targetEvent.slug}`);
  } catch (error) {
    console.error("Etkinlik kayıt hatası:", error);
    // Hata durumunda kullanıcıyı etkinlik detay sayfasına yönlendir (daha iyi hata yönetimi eklenebilir)
    res.redirect(`/events/${targetEventSlug}`);
  }
};

exports.post_cancel_register = async (req, res) => {
  const { eventId } = req.body;
  // Oturumdan kullanıcının ID'sini çekiyoruz
  const userId = req.session.user.id;

  try {
    // 1. İptal edilecek kaydı bul (Kontenjan güncellemesi için gerekli)
    const registration = await Registration.findOne({
      where: {
        userId: userId,
        eventId: eventId,
      },
      include: [{ model: Event }], // Kontenjan güncellemesi için Event'i dahil et
    });

    if (!registration) {
      req.session.error = "İptal edilecek kayıt bulunamadı.";
      return res.redirect("/user/registrations");
    }

    const event = registration.Event;

    // 2. Kayıt iptalini gerçekleştir (Registration satırını sil)
    const deletedCount = await registration.destroy();

    if (deletedCount > 0) {
      // 3. Kontenjanı Geri Yükle (Eğer event.quota > 0 ise)
      if (event) {
        // event.quota'yı 1 artır
        await event.update({ quota: event.quota + 1 });
      }

      req.session.success = `Etkinlik kaydınız ("${event.title}") başarıyla iptal edildi ve kontenjan güncellendi.`;
    } else {
      req.session.error = "Kayıt iptal edilemedi.";
    }

    // Kullanıcıyı kayıt listesi sayfasına geri yönlendir
    res.redirect("/user/registrations");
  } catch (err) {
    console.error("Kayıt iptal hatası:", err);
    req.session.error = "Kayıt iptali sırasında beklenmedik bir hata oluştu.";
    res.redirect("/user/registrations");
  }
};

exports.get_profile = (req, res) => {
  res.render("index", {
    title: "Profil",
    contentPath: "./user/profile",
  });
};

exports.get_user_attends = async (req, res) => {
  const userId = req.session.user.id;
  const userRegistrations = await Registration.findAll({
    where: { userId: userId },
    // Etkinlik detaylarını da dahil et
    include: [
      {
        model: Event,
        required: true, // Sadece Event'in olduğu kayıtları getir
      },
    ],
    order: [["registrationDate", "DESC"]], // En son kayıt yapılanı en üste getir
  });

  res.render("index", {
    title: "Kayıtlı Etkinlikler",
    contentPath: "./user/registrations",
    registrations: userRegistrations,
  });
};
