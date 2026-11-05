import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post('/register', userController.createUser);
router.get('/profile', auth(Role.ADMIN), userController.getUserProfile);

export const userRoutes = router;