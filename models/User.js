const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    ProfileImage: { type: String, default: "" },
    phone: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    //  Users who have given me permission to see their data
    sharedWithMe: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Index for faster lookups
userSchema.index({ "sharedWithMe.userId": 1 });

module.exports = mongoose.model("User", userSchema);
