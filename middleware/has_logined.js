const has_logined = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    // Oturum kapalıysa, kullanıcıyı ana sayfaya yönlendir
    return res.redirect("/");
  }

  // Oturum açıksa, bir sonraki middleware'e (rota işleyicisine) geç
  next();
};

module.exports = has_logined;
