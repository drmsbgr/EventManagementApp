const express = require("express");
const csrf = require("csurf"); // CSRF koruması
const guestMiddleware = require("../middleware/guest");

const controller = require("../controllers/authController");

const router = express.Router();

const csrfProtection = csrf({ cookie: false });

router.get("/login", csrfProtection, guestMiddleware, controller.get_login);
router.post("/login", csrfProtection, controller.post_login);
router.get(
  "/register",
  csrfProtection,
  guestMiddleware,
  controller.get_register
);
router.post("/register", csrfProtection, controller.post_register);
router.get("/logout", csrfProtection, guestMiddleware, controller.logout);

module.exports = router;
