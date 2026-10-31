import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  register,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfilePicture } from "../middleware/uploadMiddleware.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, currentUser);
router.patch("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, uploadProfilePicture, uploadAvatar);
router.delete("/profile/avatar", protect, removeAvatar);
export default router;
