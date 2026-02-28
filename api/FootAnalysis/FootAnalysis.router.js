const express = require("express");
const FootAnalysisrouter = express.Router();
const footAnalysisController = require("./FootAnalysis.controller");
const passport = require("passport");
const multer = require("multer");
const authenticate = passport.authenticate("jwt", { session: false });

const upload = require("../../middleware/multer");
FootAnalysisrouter.post(
  "/",
  authenticate,
  upload.single("file"),
  footAnalysisController.createFootAnalysis,
);

FootAnalysisrouter.get(
  "/",
  authenticate,
  footAnalysisController.getUserAnalyses,
);

module.exports = FootAnalysisrouter;
