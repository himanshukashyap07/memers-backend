import { Router } from "express";
import { 
    createLike, 
    getAllLikes, 
    toggleLike, 
    deleteLike 
} from "../controllers/likes.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createLike").post(createLike);
router.route("/getAllLikes").get(getAllLikes);
router.route("/toggleLike").post(toggleLike);
router.route("/deleteLike").delete(deleteLike);

export default router;
