const express = require("express");
const router = express.Router();

const csrf = require("csurf");
const csrfProtection = csrf({ cookie: false });

const controller = require("../controllers/adminController");

router.get("/", controller.get_index);

router.get("/events", controller.get_events);

router.get("/events/create", controller.get_create_event);

router.post(
  "/events/create",
  controller.upload.single("event_image"),
  controller.post_create_event
);

module.exports = router;
