import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { menuItemController } from "./menuItem.controller";

const router = Router();


// Protected routes (ADMIN,STAFF)
router.post('/', auth(Role.ADMIN), menuItemController.createMenuItem);


export const menuItemRoutes = router