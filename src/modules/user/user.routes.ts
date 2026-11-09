import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post('/register', userController.createUser);
router.get('/profile', auth(), userController.getUserProfile);
router.patch('/update-profile', auth(), userController.updateProfile);
router.patch('/change-password', auth(), userController.changePassword);

// Admin & Staff: Get all users (supports ?role=RIDER&searchTerm=...)
router.get('/users', auth(Role.ADMIN, Role.STAFF), userController.getAllUsers);
router.patch('/users/:id/role', auth(Role.ADMIN), userController.updateUserRole);
router.patch('/users/:id/status', auth(Role.ADMIN), userController.updateUserStatus);


export const userRoutes = router;