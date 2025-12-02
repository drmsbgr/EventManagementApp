const express = require("express");
const csrf = require("../middleware/csrf");
const router = express.Router();

const controller = require("../controllers/adminController");

//index
router.get("/", csrf, controller.get_index);

//events
router.get("/events", csrf, controller.get_events);
router.get("/events/create", csrf, controller.get_create_event);
router.get("/events/edit/:eventId", controller.get_edit_event);
router.post(
  "/events/create",
  csrf,
  controller.upload.single("event_image"),
  controller.post_create_event
);
router.post(
  "/events/edit/:eventId",
  controller.upload.single("event_image"),
  controller.post_edit_event
);
router.post("/events/delete/", controller.post_delete_event);

//users
router.get("/users", csrf, controller.get_users);
router.post("/users/update-role", controller.post_user_update_role);
router.post("/users/delete", controller.post_user_delete);

//stats
router.get("/stats", csrf, controller.get_stats);

//announcements
router.get("/announcements", csrf, controller.get_announcements);
router.post("/announcements/create", controller.post_announcement);
router.get(
  "/announcements/edit/:announcementId",
  csrf,
  controller.get_announcement_edit
);
router.post(
  "/announcements/edit/:announcementId",
  controller.post_announcement_edit
);
router.post("/announcements/delete", controller.post_announcement_delete);

module.exports = router;
