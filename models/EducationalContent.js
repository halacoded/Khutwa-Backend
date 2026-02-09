const mongoose = require("mongoose");

const educationalContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      enum: ["article", "video", "image", "guide"],
      default: "article",
    },

    category: {
      type: String,
      enum: [
        "prevention",
        "foot_care",
        "nutrition",
        "exercise",
        "monitoring",
        "emergency",
      ],
      default: "prevention",
    },

    // Simple photo/thumbnail field
    photo: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("EducationalContent", educationalContentSchema);
