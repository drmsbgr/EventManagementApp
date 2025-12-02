const express = require("express");

const cookieParser = require("cookie-parser");
const { connectDB, sequelize } = require("./db"); // sequelize objesi de alınıyor
const dotenv = require("dotenv");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

//seed veriler
const { seedUsers, seedEvents } = require("./seeders/initialData");

//models
const Event = require("./models/event");
const Registration = require("./models/registration");
const Question = require("./models/question");
const Announcement = require("./models/announcement");
const User = require("./models/user");
const OnlineVisitor = require("./models/OnlineVisitor");

async function seedDatabase() {
  try {
    // Kontrol: Zaten kullanıcı var mı? Varsa tekrar seed etme.
    const userCount = await User.count();
    if (userCount > 0) {
      console.log("Database zaten dolu, seed işlemi atlanıyor.");
      return;
    }

    console.log("Database'e başlangıç verileri ekleniyor...");

    // 1. Kullanıcıları ekle
    const createdUsers = await User.bulkCreate(seedUsers, {
      validate: true, // Model kısıtlamalarını kontrol et
    });

    // 2. Etkinlikleri ekle (creatorId için ilk kullanıcının ID'sini kullan)
    // createdUsers[0] admin kullanıcısı olmalı
    const eventsWithCreator = seedEvents.map((event) => ({
      ...event,
      creatorId: createdUsers[0].id,
    }));

    await Event.bulkCreate(eventsWithCreator, {
      validate: true,
    });

    console.log(
      "Seed Data başarıyla eklendi! (Admin Email: admin@eventus.com, Şifre: 123456)"
    );
  } catch (error) {
    console.error("Seed Data eklenirken hata oluştu:", error);
  }
}

const csurf = require("csurf");

dotenv.config();

// uygulamayı başlatma ve port ayarlama
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

// --- 2. MIDDLEWARE'LER (Hemen Çalışması Gerekenler) ---
app.use("/static", express.static("public/"));
app.use(express.urlencoded({ extended: true }));
//app.use(cookieParser());
app.use(express.json());

// --- 3. MODEL İLİŞKİLERİ (ASENKRON BAĞLANTIDAN ÖNCE) ---
// Modeller require edildikten hemen sonra ilişkiler tanımlanmalı.
User.hasMany(Event, { foreignKey: "creatorId", as: "eventsCreated" });
Event.belongsTo(User, {
  foreignKey: "creatorId",
  as: "creator",
  onDelete: "SET NULL",
});
User.belongsToMany(Event, {
  through: Registration,
  foreignKey: "userId",
  as: "registeredEvents",
  onDelete: "CASCADE",
});
Event.belongsToMany(User, {
  through: Registration,
  foreignKey: "eventId",
  as: "participants",
  onDelete: "CASCADE",
});
Registration.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
Registration.belongsTo(Event, { foreignKey: "eventId", onDelete: "CASCADE" });
User.hasMany(Registration, { foreignKey: "userId" });
Event.hasMany(Registration, { foreignKey: "eventId" });
User.hasMany(Question, {
  foreignKey: "userId",
  as: "userQuestions",
  onDelete: "CASCADE",
});
Question.belongsTo(User, {
  foreignKey: "userId",
  as: "asker", // Soruyu soran kişiyi çekmek için alias
  onDelete: "CASCADE",
});
// Bir etkinlik birden fazla soruya sahip olabilir
Event.hasMany(Question, {
  foreignKey: "eventId",
  as: "eventQuestions",
  onDelete: "CASCADE",
});
Question.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
  onDelete: "CASCADE",
});
User.hasMany(Announcement, {
  foreignKey: "creatorId",
  as: "announcementsCreated",
});
Announcement.belongsTo(User, {
  foreignKey: "creatorId",
  as: "publisher",
  onDelete: "SET NULL", // Admin silinse bile duyuru kalsın.
});

// --- 4. ASENKRON BAĞLANTI, SENKRONİZASYON VE SUNUCU BAŞLATMA (KRİTİK BÖLÜM) ---
connectDB()
  .then(() => {
    // 1. Tabloları senkronize et (ilişkilerin Sequelize'a tam olarak kaydedilmesi için)
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    await seedDatabase();
    // 2. Session tablosunu senkronize et ve session store'u hazırla
    const sessionStore = new SequelizeStore({
      db: sequelize,
      tableName: "sessions",
    });
    await sessionStore.sync();
    return sessionStore; // store'u promise'den döndür
  })
  .then((sessionStore) => {
    console.log("Veritabanı Tabloları ve Oturum Deposu Senkronize Edildi.");

    // --- 5. OTURUM VE CSRF MIDDLEWARE'LERİ (SYNC SONRASI) ---
    // Session middleware'i kurulur
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24,
          secure: process.env.NODE_ENV === "production",
        },
        store: sessionStore, // Kalıcı depolama artık hazır ve kullanılıyor
      })
    );

    app.use(csurf());

    const ipTracker = require("./middleware/ip_tracker");
    app.use(ipTracker);

    const is_auth = require("./middleware/is_auth");
    const is_admin = require("./middleware/is_admin");
    const locals = require("./middleware/locals");

    // Değişkenleri tüm viewlara aktarma middleware'i
    app.use(locals);

    // duyuru middleware
    app.use(async (req, res, next) => {
      try {
        // En son yayınlanmış duyuruyu çek
        const latestAnnouncement = await Announcement.findOne({
          where: { isPublished: true },
          order: [["createdAt", "DESC"]],
        });
        res.locals.latestAnnouncement = latestAnnouncement; // View'lara aktar
      } catch (err) {
        res.locals.latestAnnouncement = null;
      }
      next();
    });

    //ROUTERS
    const homepageRouter = require("./routers/homepageRouter");
    const adminRouter = require("./routers/adminRouter");
    const userRouter = require("./routers/userRouter");
    const authRouter = require("./routers/authRouter");
    const eventRouter = require("./routers/eventRouter");

    app.use("/", homepageRouter);
    app.use("/admin", is_admin, adminRouter);
    app.use("/user", is_auth, userRouter);
    app.use("/auth", authRouter);
    app.use("/events", eventRouter);

    // 404 Sayfası
    app.use((req, res) => {
      res.status(404).render("index", {
        title: "Sayfa Bulunamadı",
        contentPath: "helper/404",
        csrfToken: req.csrfToken(),
      });
    });

    // Sunucuyu başlat (Her şey hazır olduğunda)
    app.listen(port, () => {
      console.log(`Uygulama başlatıldı: http://localhost:${port}`);
      // --- OTOMATİK IP TEMİZLEME MEKANİZMASI ---
      const cleanupInterval = 1000 * 60 * 60; // Her 1 saatte bir

      setInterval(async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        await OnlineVisitor.destroy({
          where: { lastActive: { [sequelize.Sequelize.Op.lt]: oneHourAgo } }, // Son 1 saatten daha eski olanları sil
        });
        // console.log("Eski ziyaretçi kayıtları temizlendi.");
      }, cleanupInterval);
    });
  })
  .catch((err) => {
    console.error("Veritabanı Başlatmada Kritik Hata:", err);
  });
