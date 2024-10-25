import { Router } from "express";
import { subscribeToChannel, unsubscribeToChannel } from "../controllers/subscriptionController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

router.route('/subscribe').post(isAuthenticated, subscribeToChannel);
router.route('/unsubscribe').post(isAuthenticated, unsubscribeToChannel);

export default router;
