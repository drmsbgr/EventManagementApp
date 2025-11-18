const express = require("express");
const router = express.Router();

const controller = require("../controllers/userController");

router.get("/profile", controller.get_profile);
router.get("/attends", controller.get_user_attends);

module.exports = router;
