const guest = (req, res, next) => {
  // req.session.isLoggedIn değerini kontrol et
  if (req.session.isLoggedIn) {
    // Oturum açıksa, kullanıcıyı ana sayfaya yönlendir
    return res.redirect("/");
  }

  // Oturum kapalıysa, bir sonraki middleware'e (rota işleyicisine) geç
  next();
};

module.exports = guest;
