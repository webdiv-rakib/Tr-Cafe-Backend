import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { menuItemController } from "./menuItem.controller";

const router = Router();

// Public routes
router.get('/', menuItemController.getAllMenuItems);
router.get('/specials', menuItemController.getSpecialMenuItems);
router.get('/:id', menuItemController.getMenuItemById);


// Protected routes (ADMIN,STAFF)
router.post('/', auth(Role.ADMIN), menuItemController.createMenuItem);
router.patch('/:id', auth(Role.ADMIN), menuItemController.updateMenuItem);
router.delete('/:id', auth(Role.ADMIN), menuItemController.deleteMenuItem);
router.patch('/:id/toggle-special', auth(Role.ADMIN,Role.STAFF), menuItemController.toggleItemSpecialStatus);


export const menuItemRoutes = router