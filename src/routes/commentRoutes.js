import { Router } from 'express';
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/commentController.js"
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

router.use(isAuthenticated); // It applies authentication middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;