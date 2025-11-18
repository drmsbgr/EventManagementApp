const express = require("express");
const { connectDB } = require("./db");
const dotenv = require("dotenv");
const session = require("express-session"); // Oturum yönetimi
const csrf = require("csurf"); // CSRF koruması
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const { sequelize } = require("./db");

dotenv.config();

const userRouter = require("./routers/userRouter");
const authRouter = require("./routers/authRouter");

const app = express();
const port = process.env.PORT || 3000;

connectDB();

const sessionStore = new SequelizeStore({
  db: sequelize, // Oturumları kaydetmek için Sequelize örneğimizi kullan
  tableName: "sessions", // Oturum verilerinin tutulacağı tablo adı
});

sessionStore.sync();

app.set("view engine", "ejs");
app.use("/static", express.static("public/"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
    },
    // --- KALICI DEPOLAMA EKLENTİSİ ---
    store: sessionStore,
    // ---------------------------------
  })
);

// CSRF Koruma Middleware'i
const csrfProtection = csrf({ cookie: false });

// Global Değişkenler (Session ve CSRF token'ı EJS'e aktarmak için)
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : ""; // CSRF tokenını EJS'e aktar

  // Eğer oturum açıksa, kullanıcı nesnesini view'lere gönder.
  if (req.session.isLoggedIn && req.session.user) {
    // Oturumdaki kullanıcı nesnesini doğrudan locals'a aktarabiliriz
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null; // Giriş yapılmamışsa null olsun
  }

  next();
});

app.use((req, res, next) => {
  //console.log(req.url, req.method);
  next();
});

//anasayfa
app.get("/", (req, res) => {
  res.render("index", { title: "Ana Sayfa", contentPath: "index-events" });
});

//etkinlikler sayfası
app.get("/events", (req, res) => {
  res.render("index", { title: "Etkinlikler", contentPath: "events" });
});

//sss sayfası
app.get("/faq", (req, res) => {
  res.render("index", { title: "Soru-Cevap", contentPath: "faq" });
});

//routers
app.use("/user", userRouter);
app.use("/auth", authRouter);

//404 sayfası
app.use((req, res) => {
  res.render("index", { title: "Sayfa Bulunamadı", contentPath: "helper/404" });
});

app.listen(port, () =>
  console.log(`Uygulama başlatıldı: http://localhost:${port}`)
);
