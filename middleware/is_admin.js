const isAdmin = (req, res, next) => {
  // 1. Kullanıcı giriş yapmış mı?
  if (!req.session.isLoggedIn) {
    req.session.error = "Bu sayfaya erişmek için giriş yapmalısınız.";
    return res.redirect("/auth/login");
  }

  // 2. Rolü "admin" mi?
  if (req.session.user && req.session.user.role === "admin") {
    // Rolü admin ise devam et
    next();
  } else {
    // Rolü admin değilse 403 (Yasak) hatası ver veya ana sayfaya yönlendir
    req.session.error = "Bu sayfaya erişim yetkiniz bulunmamaktadır.";
    return res.render("index", {
      title: "Erişim Engellendi",
      contentPath: "./helper/403",
      csrfToken: req.csrfToken(),
    });
    // Veya daha profesyonel bir yaklaşım:
    // res.status(403).render('index', { title: 'Erişim Engellendi', contentPath: '403' });
  }
};

module.exports = isAdmin;
