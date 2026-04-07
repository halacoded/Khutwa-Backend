require("dotenv").config();

// imports
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./database");
const NotFoundHandller = require("./middleware/notFoundHandler");
const ErrorHandler = require("./middleware/errorHandler");
const passport = require("passport");
const path = require("path");

// passport strategies
const { localStrategy, JwtStrategy } = require("./middleware/passport");
const {
  clinicianLocalStrategy,
  clinicianJwtStrategy,
} = require("./middleware/clinician.passport");

// routes
const usersRouter = require("./api/User/User.router.js");
const clinicianRouter = require("./api/Clinician/Clinician.router.js");
const educationRouter = require("./api/EducationalContent/EducationalContent.router.js");
const sensorRouter = require("./api/Sensor/Sensor.router.js");

// init
const app = express();
connectDB();
const Port = process.env.PORT || 10000;

// CORS Options
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.endsWith(".lovable.app")) return callback(null, true);
    if (origin.includes("localhost")) return callback(null, true);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// middleware
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());

// ONE OPTIONS handler only
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});


// middleware
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());

// Safe OPTIONS handler (avoids app.options("*") crash)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// passport init
passport.use("local", localStrategy);
passport.use("jwt", JwtStrategy);
passport.use("clinician-local", clinicianLocalStrategy);
passport.use("clinician-jwt", clinicianJwtStrategy);

// routes
app.use("/users", usersRouter);
app.use("/clinicians", clinicianRouter);
app.use("/educational-content", educationRouter);
app.use("/media", express.static(path.join(__dirname, "media")));
app.use("/sensor", sensorRouter);

// handlers
app.use(NotFoundHandller);
app.use(ErrorHandler);

app.listen(Port, () => {
  console.log(`Server running on ${Port}`);
});