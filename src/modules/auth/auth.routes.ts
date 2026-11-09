import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/auth";

const router = Router();
router.post('/login', auth(), authController.loginUser);
router.post('/refresh-token', auth(), authController.refreshToken);

export const authRoutes = router;