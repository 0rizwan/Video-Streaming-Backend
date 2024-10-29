import { Router } from 'express';
import { getChannelStats, getChannelVideos } from "../controllers/dashboardController.js"
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

router.use(isAuthenticated); // Apply authentication middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router;
