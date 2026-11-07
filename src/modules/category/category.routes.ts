import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { categoryController } from "./category.controller";

const router = Router();
// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);


// Protected routes (ADMIN,STAFF)
router.post('/', auth(Role.ADMIN), categoryController.createCategory);
router.patch('/:id', auth(Role.ADMIN), categoryController.updateCategory);
router.delete('/:id', auth(Role.ADMIN), categoryController.deleteCategory);

export const categoryRoutes = router;