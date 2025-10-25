const User = require("../models/User");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const dotenv = require("dotenv");
dotenv.config();

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      console.log("Passport looking for user with email:", email);

      const foundUser = await User.findOne({ email: email });
      if (!foundUser) {
        console.log("User not found with email:", email);
        return done(null, false, { message: "Email or password incorrect" });
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);
      if (!isMatch) {
        console.log("Password mismatch for user:", email);
        return done(null, false, { message: "Email or password incorrect" });
      }

      console.log("Login successful for:", email);
      return done(null, foundUser);
    } catch (error) {
      console.error("Passport error:", error);
      return done(error);
    }
  }
);

const JwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (!user) return done(null, false, { message: "User not found" });

      const expiry = new Date(payload.exp * 1000);
      const now = new Date();
      if (now > expiry) return done(null, false, { message: "Token expired" });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

module.exports = { localStrategy, JwtStrategy };
