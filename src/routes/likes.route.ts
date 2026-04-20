import { Router } from "express";
import { 
    createLike, 
    getAllLikes, 
    toggleLike, 
    deleteLike,
    getAdminAllLikes
} from "../controllers/likes.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createLike").post(createLike);
router.route("/getAllLikes").get(getAllLikes);
router.route("/toggleLike").post(toggleLike);
router.route("/deleteLike").delete(deleteLike);
router.route("/admin/all").get(getAdminAllLikes);

export default router;
