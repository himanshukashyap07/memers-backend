import { Router } from "express";
import { 
    createComment, 
    getAllComment, 
    updateComment, 
    deleteComment 
} from "../controllers/comments.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/addComment").post(createComment);
router.route("/getPostComments").get(getAllComment);
router.route("/updateComment").patch(updateComment);
router.route("/deleteComment").delete(deleteComment);

export default router;
