const FootAnalysis = require("../../models/FootAnalysis");
const axios = require("axios");
const FormData = require("form-data");

// Create new foot analysis
exports.createFootAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    // Send image buffer directly to Flask server (no disk write needed)
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "foot.jpg",
      contentType: req.file.mimetype || "image/jpeg",
    });

    const flaskResponse = await axios.post(
      `${process.env.ML_API_URL}/predict`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 55000, // 55s — allows Render free tier to wake up
      },
    );

    const { prediction, confidence } = flaskResponse.data;

    // Save analysis result in MongoDB
    const analysis = new FootAnalysis({
      user: userId,
      imageUrl: "",
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
    const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    res.status(500).json({
      success: false,
      message: isTimeout
        ? "ML server is waking up, please try again in 30 seconds"
        : error.message || "Server error",
    });
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
