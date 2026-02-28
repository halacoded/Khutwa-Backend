const FootAnalysis = require("../../models/FootAnalysis");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// Create new foot analysis
exports.createFootAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const imagePath = req.file.path;
    // Send image to Flask server
    const form = new FormData();
    form.append("file", fs.createReadStream(imagePath));

    const flaskResponse = await axios.post(
      "http://localhost:5000/predict",
      form,
      {
        headers: form.getHeaders(),
      },
    );

    const { prediction, confidence } = flaskResponse.data;

    // Save analysis result in MongoDB
    const analysis = new FootAnalysis({
      user: userId,
      imageUrl: imagePath,
      result: prediction,
      confidence: confidence,
    });

    await analysis.save();

    res.status(201).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all analyses for a user
exports.getUserAnalyses = async (req, res) => {
  try {
    const userId = req.user._id;
    const analyses = await FootAnalysis.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: analyses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
