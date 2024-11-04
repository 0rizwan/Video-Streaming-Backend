import { Router } from "express";
import { getAllSubscriptions, subscribeToChannel, unsubscribeToChannel } from "../controllers/subscriptionController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

router.use(isAuthenticated);

router.route('/:channelId/subscribe').post(subscribeToChannel);
router.route('/:channelId/unsubscribe').post(unsubscribeToChannel);
router.route('/').get(getAllSubscriptions);

export default router;
