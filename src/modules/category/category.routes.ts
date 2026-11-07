import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { categoryController } from "./category.controller";

const router = Router();
// Public routes
router.get('/', categoryController.getAllCategories)



// Protected routes (ADMIN,STAFF)
router.post('/', auth(Role.ADMIN), categoryController.createCategory);

export const categoryRoutes = router;