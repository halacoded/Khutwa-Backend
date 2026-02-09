const Clinician = require("../models/Clinician");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const dotenv = require("dotenv");
dotenv.config();

const clinicianLocalStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      console.log("Passport looking for clinician with email:", email);

      const foundClinician = await Clinician.findOne({ email: email });
      if (!foundClinician) {
        console.log("Clinician not found with email:", email);
        return done(null, false, { message: "Email or password incorrect" });
      }

      const isMatch = await bcrypt.compare(password, foundClinician.password);
      if (!isMatch) {
        console.log("Password mismatch for clinician:", email);
        return done(null, false, { message: "Email or password incorrect" });
      }

      console.log("Clinician login successful for:", email);
      return done(null, foundClinician);
    } catch (error) {
      console.error("Clinician passport error:", error);
      return done(error);
    }
  },
);

// ============================
// JWT STRATEGY (for token authentication)
// ============================
const clinicianJwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      // Check if token is for clinician (has role field)
      if (payload.role !== "clinician") {
        return done(null, false, { message: "Invalid token for clinician" });
      }

      const clinician = await Clinician.findById(payload.id);
      if (!clinician) {
        return done(null, false, { message: "Clinician not found" });
      }

      const expiry = new Date(payload.exp * 1000);
      const now = new Date();
      if (now > expiry) {
        return done(null, false, { message: "Token expired" });
      }

      return done(null, clinician);
    } catch (error) {
      return done(error);
    }
  },
);

module.exports = { clinicianLocalStrategy, clinicianJwtStrategy };
