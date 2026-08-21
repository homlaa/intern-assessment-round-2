const express = require("express");
const path = require("path");

const attendeeRoutes = require("./routes/attendeRoutes");

const app = express();

app.use(express.json());

app.use(express.static(
  path.join(__dirname, "../public")
));

app.use("/api/attendees", attendeeRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled application error:", error);

  res.status(500).json({
    error: "Internal server error"
  });
});

module.exports = app;