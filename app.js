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
const {
  localStrategy,
  jwtStrategy,
  JwtStrategy,
} = require("./middleware/passport");

//import route
const usersRouter = require("./api/User/User.router.js");
//init
dotenv.config();
const app = express();
connectDB();
const Port = process.env.PORT;

//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
passport.use("local", localStrategy);
passport.use("jwt", JwtStrategy);

//Routes
app.use("/api/users", usersRouter);

//Handler
app.use(NotFoundHandller);
app.use(ErrorHandler);
//start listen
app.listen(Port, () => {
  console.log(`Server running on ${Port}`);
});
