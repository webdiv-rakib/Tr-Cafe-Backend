import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { orderController } from "./order.controller";

const router = Router()

// Customer personal routes
router.post('/', auth(Role.CUSTOMER), orderController.createOrder);
router.get('/my-orders', auth(Role.CUSTOMER), orderController.getMyOrders);

// Signle order route for Authorized Role
router.get('/:id', auth(Role.ADMIN, Role.CUSTOMER, Role.RIDER, Role.STAFF), orderController.getOrderById);


export const orderRoutes = router;