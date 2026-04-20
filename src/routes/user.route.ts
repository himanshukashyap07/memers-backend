import { Router } from "express";
import { 
    getCurrentUser, 
    loginUser, 
    logOutUser, 
    registerUser, 
    updateUserPassword,
    verifyUser,
    updateUserAvatar,
    getUserProfile,
    getAllUsers,
    toggleBlockUser,
    deleteUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/registerUser").post(upload.single("avatar"), registerUser);
router.route("/userVerification").post(verifyUser);
router.route("/login").post(loginUser);

// Private routes
router.route("/currentUser").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/updatePassword").patch(verifyJWT, updateUserPassword);
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/getUserProfile").get(verifyJWT, getUserProfile);

// Admin routes
router.route("/users").get(verifyJWT, getAllUsers);
router.route("/blockUser").patch(verifyJWT, toggleBlockUser);
router.route("/deleteUser").delete(verifyJWT, deleteUser);

export default router;