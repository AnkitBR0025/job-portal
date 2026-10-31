import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  profile: user.profile,
});
export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({
        message: "Only applicant or recruiter registration is allowed",
      });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "That email is already registered" });
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res
      .cookie("token", createToken(user._id), cookieOptions)
      .json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
export function logout(req, res) {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: undefined })
    .status(204)
    .send();
}
export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });

export async function updateProfile(req, res, next) {
  try {
    const allowed = req.user.role === 'recruiter'
      ? ['headline', 'phone', 'location', 'bio', 'companyName', 'companyWebsite', 'industry', 'companySize', 'jobTitle']
      : ['headline', 'phone', 'location', 'bio', 'skills', 'resumeUrl'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'skills') {
        updates[`profile.${key}`] = (Array.isArray(req.body[key]) ? req.body[key] : String(req.body[key]).split(','))
          .map(item => String(item).trim()).filter(Boolean).slice(0, 30);
      } else {
        updates[`profile.${key}`] = String(req.body[key]).trim();
      }
    }
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
      updates.name = name;
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
}


// Upload or replace the authenticated user's profile picture.
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Please select a profile picture" });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: "Cloudinary is not configured. Check backend .env" });
    }
    const result = await uploadToCloudinary(req.file.buffer, "careernest/profile-pictures", "image");
    const previousPublicId = req.user.avatar?.publicId;
    req.user.avatar = { url: result.secure_url, publicId: result.public_id };
    await req.user.save();
    if (previousPublicId) {
      try { await cloudinary.uploader.destroy(previousPublicId, { resource_type: "image" }); }
      catch (deleteError) { console.error("Could not delete previous profile picture:", deleteError.message); }
    }
    res.status(200).json({ message: "Profile picture uploaded successfully", user: safeUser(req.user) });
  } catch (error) { next(error); }
}

// Remove the authenticated user's profile picture.
export async function removeAvatar(req, res, next) {
  try {
    const publicId = req.user.avatar?.publicId;
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    req.user.avatar = { url: "", publicId: "" };
    await req.user.save();
    res.status(200).json({ message: "Profile picture removed successfully", user: safeUser(req.user) });
  } catch (error) { next(error); }
}
