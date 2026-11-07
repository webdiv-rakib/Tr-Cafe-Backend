import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { orderController } from "./order.controller";

const router = Router()

// Public routes
router.post('/', auth(Role.CUSTOMER), orderController.createOrder);

// Protected routes


export const orderRoutes = router;