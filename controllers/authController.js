const bcrypt = require("bcryptjs"); // Şifre hashleme
const User = require("../models/user");

exports.get_login = (req, res) => {
  res.render("index", {
    title: "Giriş Yap",
    contentPath: "./auth/login",
    csrfToken: req.csrfToken(),
  });
};

exports.post_login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Kullanıcıyı e-posta ile bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render("index", {
        title: "Giriş Yap",
        contentPath: "auth/login",
        error: "E-posta veya şifre hatalı.",
        csrfToken: req.csrfToken(),
      });
    }

    // 2. Girilen şifre ile Hashlenmiş şifreyi karşılaştır
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("index", {
        title: "Giriş Yap",
        contentPath: "auth/login",
        error: "E-posta veya şifre hatalı.",
        csrfToken: req.csrfToken(),
      });
    }

    // 3. Başarılı giriş: Oturumu başlat
    req.session.isLoggedIn = true;
    req.session.user = user; // Kullanıcı verilerini oturumda sakla

    // Admin mi kullanıcı mı kontrolü yaparak yönlendir
    if (user.role === "admin") {
      return res.redirect("/admin");
    }
    return res.redirect("/events");
  } catch (err) {
    console.error("Giriş hatası:", err);
    return res.render("index", {
      title: "Giriş Yap",
      contentPath: "auth/login",
      error: "Bir hata oluştu. Lütfen tekrar deneyin.",
      csrfToken: req.csrfToken(),
    });
  }
};

exports.get_register = (req, res) => {
  res.render("index", {
    title: "Kayıt Ol",
    contentPath: "./auth/register",
    csrfToken: req.csrfToken(),
  });
};

exports.post_register = async (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  // Basit doğrulama
  if (password !== passwordConfirm) {
    return res.render("index", {
      title: "Kayıt Ol",
      contentPath: "auth/register",
      error: "Şifreler uyuşmuyor.",
      csrfToken: req.csrfToken(),
    });
  }

  try {
    // 1. Email'in zaten var olup olmadığını kontrol et
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render("index", {
        title: "Kayıt Ol",
        contentPath: "auth/register",
        error: "Bu e-posta adresi zaten kullanılıyor.",
        csrfToken: req.csrfToken(),
      });
    }

    // 2. Şifreyi Hashle (Kriter)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Yeni kullanıcıyı oluştur ve kaydet
    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: "user", // Varsayılan rol
    });

    // Başarılı kayıt sonrası giriş sayfasına yönlendir
    req.session.isLoggedIn = true;
    req.session.user = newUser;
    return res.redirect("/auth/login"); // Başarılıysa logine git
  } catch (err) {
    console.error("Kayıt hatası:", err);
    return res.render("index", {
      title: "Kayıt Ol",
      contentPath: "auth/register",
      error: "Bir hata oluştu. Lütfen tekrar deneyin.",
      csrfToken: req.csrfToken(),
    });
  }
};

exports.logout = (req, res) => {
  console.log("Çıkış yapılıyor...");
  req.session.destroy((err) => {
    if (err) {
      console.log("Oturum sonlandırma hatası:", err);
    }
    res.redirect(req.get("Referer") || "/");
  });
};
