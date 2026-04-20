import { Router } from "express";
import { 
    getNotifications, 
    markNotificationAsRead 
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(getNotifications);
router.route("/read").patch(markNotificationAsRead);

export default router;
