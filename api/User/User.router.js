const express = require("express");
const usersRouter = express.Router();
const passport = require("passport");
const upload = require("../../middleware/multer");
const {
  signup,
  signin,
  getProfile,
  updateProfile,
  shareMyData,
  removeSharedAccess,
  removeFromMyShared,
  getUsersICanSee,
  getUsersSharingWithMe,
  searchUsersForSharing,
} = require("./User.controller");
const authenticate = passport.authenticate("jwt", { session: false });

// Authentication routes
usersRouter.post(
  "/signup",
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]),
  signup,
);
usersRouter.post(
  "/signin",
  passport.authenticate("local", { session: false }),
  signin,
);

// User management routes
usersRouter.get("/profile", authenticate, getProfile);
usersRouter.put(
  "/profile",
  authenticate,
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]),
  updateProfile,
);

// ============================
// SHARED ACCESS ROUTES
// ============================

// Share my data with another user
usersRouter.post("/share", authenticate, shareMyData);

// Remove sharing access from a user
usersRouter.delete("/unshare/:targetUserId", authenticate, removeSharedAccess);

// Remove a user from my shared list (stop seeing their data) - NEW ROUTE
usersRouter.delete(
  "/shared/remove/:targetUserId",
  authenticate,
  removeFromMyShared,
);

// Get users who can see my data (users I've shared with)
usersRouter.get("/shared/users-i-can-see", authenticate, getUsersICanSee);

// Get users whose data I can see (users sharing with me)
usersRouter.get(
  "/shared/users-sharing-with-me",
  authenticate,
  getUsersSharingWithMe,
);

// Search for users to share with
usersRouter.get("/shared/search", authenticate, searchUsersForSharing);

module.exports = usersRouter;
