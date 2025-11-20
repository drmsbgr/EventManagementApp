const express = require("express");

const cookieParser = require("cookie-parser");
const { connectDB, sequelize } = require("./db"); // sequelize objesi de alınıyor
const dotenv = require("dotenv");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const User = require("./models/user");
const Event = require("./models/event");
const Registration = require("./models/Registration");
const csrf = require("csurf");

dotenv.config();

// --- 1. UYGULAMA VE AYARLAR ---
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

// --- 2. MIDDLEWARE'LER (Hemen Çalışması Gerekenler) ---
app.use("/static", express.static("public/"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

// --- 3. MODEL İLİŞKİLERİ (ASENKRON BAĞLANTIDAN ÖNCE) ---
// Modeller require edildikten hemen sonra ilişkiler tanımlanmalı.
User.hasMany(Event, { foreignKey: "creatorId", as: "eventsCreated" });
Event.belongsTo(User, { foreignKey: "creatorId", as: "creator" });
User.belongsToMany(Event, {
  through: Registration,
  foreignKey: "userId",
  as: "registeredEvents",
});
Event.belongsToMany(User, {
  through: Registration,
  foreignKey: "eventId",
  as: "participants",
});
Registration.belongsTo(User, { foreignKey: "userId" });
Registration.belongsTo(Event, { foreignKey: "eventId" });
User.hasMany(Registration, { foreignKey: "userId" });
Event.hasMany(Registration, { foreignKey: "eventId" });

// --- 4. ASENKRON BAĞLANTI, SENKRONİZASYON VE SUNUCU BAŞLATMA (KRİTİK BÖLÜM) ---
connectDB()
  .then(() => {
    // 1. Tabloları senkronize et (ilişkilerin Sequelize'a tam olarak kaydedilmesi için)
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
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

    const csrfProtection = csrf({ cookie: false });
    //app.use(csrfProtection);
    app.use((req, res, next) => {
      req.csrfToken = () => "test";
      next();
    });

    const has_logined = require("./middleware/has_logined");
    const is_admin = require("./middleware/is_admin");

    // Global Değişkenler Middleware'i
    app.use((req, res, next) => {
      res.locals.isAuthenticated = req.session.isLoggedIn;
      res.locals.user = req.session.user || null;
      next();
    });

    // --- 6. ROUTER'LAR (SON İŞLEM) ---
    // Router'lar, tüm middleware ve ilişki tanımlamaları yapıldıktan sonra require edilir.
    const adminRouter = require("./routers/adminRouter");
    const userRouter = require("./routers/userRouter");
    const authRouter = require("./routers/authRouter");

    app.use("/admin", is_admin, adminRouter);
    app.use("/user", has_logined, userRouter);
    app.use("/auth", authRouter);

    app.get("/", (req, res) => {
      res.render("index", {
        title: "Ana Sayfa",
        contentPath: "index-events",
        csrfToken: req.csrfToken(),
      });
    });

    app.get("/events", async (req, res) => {
      try {
        // Yalnızca yayınlanmış etkinlikleri çekeriz.
        const events = await Event.findAll({
          where: { isPublished: true },
          order: [["date", "ASC"]], // En yakın tarihtekiler üstte
        });

        // Burada filtreleme (req.query) mantığı da uygulanabilir.

        res.render("index", {
          title: "Tüm Etkinlikler",
          contentPath: "events",
          events: events, // Etkinlik listesini view'a gönder
          csrfToken: req.csrfToken(),
        });
      } catch (error) {
        console.error("Tüm etkinlikleri yükleme hatası:", error);
        res.render("index", {
          title: "Hata",
          contentPath: "events",
          events: [],
          error: "Etkinlikler yüklenirken bir hata oluştu.",
        });
      }
    });

    app.get("/faq", (req, res) => {
      res.render("index", {
        title: "Soru-Cevap",
        contentPath: "faq",
        csrfToken: req.csrfToken(),
      });
    });

    // 404 Sayfası
    app.use((req, res) => {
      res.status(404).render("index", {
        title: "Sayfa Bulunamadı",
        contentPath: "helper/404",
        csrfToken: req.csrfToken(),
      });
    });

    // Sunucuyu başlat (Her şey hazır olduğunda)
    app.listen(port, () =>
      console.log(`Uygulama başlatıldı: http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error("Veritabanı Başlatmada Kritik Hata:", err);
  });
