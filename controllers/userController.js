exports.get_profile = (req, res) => {
  res.render("index", { title: "Profil", contentPath: "./user/profile" });
};

exports.get_user_attends = (req, res) => {
  res.render("index", {
    title: "Kayıtlı Etkinlikler",
    contentPath: "./user/attends",
  });
};
