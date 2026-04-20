import { Router } from "express";
import { 
    createFollow, 
    getFollowers, 
    getFollowing, 
    getFriends, 
    followBack,
    unfollowUser,
    getAdminAllFriends
} from "../controllers/friends.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/createFollow").post(createFollow);
router.route("/getFollowers").get(getFollowers);
router.route("/getFollowing").get(getFollowing);
router.route("/getfriends").get(getFriends);
router.route("/FollowBack").patch(followBack);
router.route("/unfollow").post(unfollowUser);
router.route("/admin/all").get(getAdminAllFriends);

export default router;
