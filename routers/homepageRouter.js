const express = require("express");
const controller = require("../controllers/homepageController");
const csrf = require("../middleware/csrf");
const router = express.Router();

router.get("", csrf, controller.get_index);
router.get("/faq", controller.get_faq);

module.exports = router;
