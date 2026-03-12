import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../models/User.model.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.checkPassword(password))) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, COOKIE_OPTIONS);
  res.json(user);
}

export async function logout(req, res) {
  res.clearCookie("token");
  res.status(204).end();
}
