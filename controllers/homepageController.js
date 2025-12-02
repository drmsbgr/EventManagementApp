const Event = require("../models/event");

exports.get_index = async (req, res) => {
  try {
    // en çok görüntülenme alan etkinlikleri listele
    const featuredEvents = await Event.findAll({
      where: { isPublished: true }, // Sadece yayınlanmış olanları dikkate al
      order: [["numOfViews", "DESC"]], //En çok görüntüleneni en üste getir
      limit: 5,
    });

    res.render("index", {
      title: "Ana Sayfa",
      contentPath: "index-events",
      featuredEvents: featuredEvents, // En popüler liste view'a gönderilir
    });
  } catch (error) {
    console.error("Ana sayfa etkinlik yükleme hatası:", error);
    res.render("index", {
      title: "Ana Sayfa",
      contentPath: "index-events",
      featuredEvents: [],
    });
  }
};

exports.get_faq = (req, res) => {
  res.render("index", {
    title: "Soru-Cevap",
    contentPath: "faq",
    csrfToken: req.csrfToken(),
  });
};
