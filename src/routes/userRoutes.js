import { Router } from "express";
import { loginUser, registerUser } from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.route('/register').post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser);
router.route('/login').post(loginUser);

export default router;