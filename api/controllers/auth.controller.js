import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../models/User.model.js";
import crypto from "crypto";
import Invitation from "../models/Invitation.model.js";

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

export async function me(req, res) {
  const user = await User.findById(req.userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  res.json(user);
}

export async function register(req, res) {
  const { name, email, password, token } = req.body;

  if (!token) {
    throw createHttpError(400, "Invitation token is required");
  }

  const invitation = await Invitation.findOne({ token });

  if (!invitation) {
    throw createHttpError(400, "Invalid invitation token");
  }

  const user = await User.create({ name, email, password });
  await Invitation.findByIdAndDelete(invitation._id);

  const jwtToken = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", jwtToken, COOKIE_OPTIONS);
  res.status(201).json(user);
}

export async function updateProfile(req, res) {
  const user = await User.findById(req.userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

  await user.save();
  res.json(user);
}

export async function createInvitation(req, res) {
  const token = crypto.randomUUID();

  const invitation = await Invitation.create({
    token,
    createdBy: req.userId,
  });

  res.status(201).json({ token: invitation.token });
}
