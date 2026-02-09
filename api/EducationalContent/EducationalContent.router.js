const express = require("express");
const educationRouter = express.Router();
const passport = require("passport");
const upload = require("../../middleware/multer");
const {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats,
  getContentByCategory,
} = require("./EducationalContent.controller");

const authenticate = passport.authenticate("jwt", { session: false });

// Public routes (no authentication required)
educationRouter.get("/", getAllContent);
educationRouter.get("/category/:category", getContentByCategory);
educationRouter.get("/:id", getContentById); // View increment happens here

// Admin-only routes
educationRouter.post(
  "/",
  authenticate,
  upload.fields([{ name: "photo", maxCount: 1 }]),
  createContent,
);

educationRouter.put(
  "/:id",
  authenticate,
  upload.fields([{ name: "photo", maxCount: 1 }]),
  updateContent,
);

educationRouter.delete("/:id", authenticate, deleteContent);
educationRouter.get("/stats/overview", authenticate, getContentStats);

module.exports = educationRouter;
