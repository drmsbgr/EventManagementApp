const express = require("express");
const router = express.Router();
const csrf = require("../middleware/csrf");

const controller = require("../controllers/userController");

router.get("/profile", csrf, controller.get_profile);
router.get("/registrations", csrf, controller.get_user_attends);
router.post("/register-event/:eventId", controller.post_user_register_event);
router.post("/registrations/cancel", controller.post_cancel_register);

module.exports = router;
