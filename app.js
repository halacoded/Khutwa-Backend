//import
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./database");
const NotFoundHandller = require("./middleware/notFoundHandler");
const ErrorHandler = require("./middleware/errorHandler");
const passport = require("passport");
const path = require("path");
const { localStrategy, JwtStrategy } = require("./middleware/passport");
const {
  clinicianLocalStrategy,
  clinicianJwtStrategy,
} = require("./middleware/clinician.passport");

//import route
const usersRouter = require("./api/User/User.router.js");
const clinicianRouter = require("./api/Clinician/Clinician.router.js");
const educationRouter = require("./api/EducationalContent/EducationalContent.router.js");
const sensorRouter = require("./api/Sensor/Sensor.router.js");
const FootAnalysisRouter = require("./api/FootAnalysis/FootAnalysis.router.js");
//init
dotenv.config();
const app = express();
connectDB();
const Port = process.env.PORT || 10000;

//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
passport.use("local", localStrategy);
passport.use("jwt", JwtStrategy);
passport.use("clinician-local", clinicianLocalStrategy);
passport.use("clinician-jwt", clinicianJwtStrategy);

//Routes
app.use("/users", usersRouter);
app.use("/clinicians", clinicianRouter);
app.use("/educational-content", educationRouter);
app.use("/media", express.static(path.join(__dirname, "media")));
app.use("/api", sensorRouter);
app.use("/FootAnalysis", FootAnalysisRouter);
//Handler
app.use(NotFoundHandller);
app.use(ErrorHandler);
//start listen
app.listen(Port, () => {
  console.log(`Server running on ${Port}`);
});
