import { Router } from "express";
import { 
    createPost, 
    getAllPosts, 
    updatePost, 
    deletePost,
    getUserPosts,
    getPostsByHashtag,
    incrementShareCount
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT); // All post routes are private

router.route("/createPost").post(upload.single("image"), createPost);
router.route("/getAllPosts").get(getAllPosts);
router.route("/updatePost").patch(updatePost);
router.route("/deletePost").delete(deletePost);
router.route("/getUserPost").get(getUserPosts);
router.route("/getPostsByHashtag").get(getPostsByHashtag);
router.route("/incrementShareCount").post(incrementShareCount);

export default router;
