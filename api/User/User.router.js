const express = require("express");
const usersRouter = express.Router();
const passport = require("passport");
const upload = require("../../middleware/multer");
const {
  signup,
  signin,
  getProfile,
  updateProfile,
} = require("./User.controller");
const authenticate = passport.authenticate("jwt", { session: false });

// Authentication routes
usersRouter.post("/signup", signup);
usersRouter.post(
  "/signin",
  passport.authenticate("local", { session: false }),
  signin
);

// User management routes
usersRouter.get("/profile", authenticate, getProfile);
usersRouter.put("/profile", authenticate, updateProfile);

module.exports = usersRouter;
