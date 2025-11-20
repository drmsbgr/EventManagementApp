const express = require("express");
const router = express.Router();
const guestMiddleware = require("../middleware/guest");

const controller = require("../controllers/authController");

router.get("/login", guestMiddleware, controller.get_login);
router.post("/login", controller.post_login);
router.get("/register", guestMiddleware, controller.get_register);
router.post("/register", controller.post_register);

// Çıkış işlemini hem GET (link üzerinden) hem de POST (form üzerinden güvenli) ile yapabilmek için
router.get("/log-out", controller.logout);
router.post("/log-out", controller.logout);

module.exports = router;
