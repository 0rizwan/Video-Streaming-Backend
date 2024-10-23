import { Router } from "express";
import { changeUserAvatar, changeUserCoverImage, changeUserPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAccount } from "../controllers/userController.js";
import { upload } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";

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

// Secured routes
router.route('/logout').post(isAuthenticated, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(isAuthenticated, changeUserPassword);
router.route('/current-user').get(isAuthenticated, getCurrentUser);
router.route('/update-account').post(isAuthenticated, updateUserAccount);
router.route('/change-avatar').post(isAuthenticated, upload.single('avatar'), changeUserAvatar);
router.route('/change-cover').post(isAuthenticated, upload.single('coverImage'), changeUserCoverImage);
router.route('/get-channel-profile/:username').get(isAuthenticated, getUserChannelProfile);

export default router;