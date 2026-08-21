const express = require("express");

const {
  createAttendee,
  updateAttendeeBirthdate
} = require("../controller/attendeeController");

const router = express.Router();

router.post("/", createAttendee);
router.patch("/:id", updateAttendeeBirthdate);

module.exports = router;