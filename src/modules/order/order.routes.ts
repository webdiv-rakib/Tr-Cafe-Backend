import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { orderController } from "./order.controller";

const router = Router()

// Customer personal routes
router.post('/', auth(Role.CUSTOMER), orderController.createOrder);
router.get('/', auth(Role.ADMIN), orderController.getAllOrders);
router.get('/my-orders', auth(Role.CUSTOMER), orderController.getMyOrders);
router.get('/assigned-deliveries', auth(Role.RIDER), orderController.getAssignedDeliveries);

// Signle order route for Authorized Role
router.patch('/:id/status', auth(Role.ADMIN), orderController.updateOrderStatus);
router.patch('/:id/assign-rider', auth(Role.ADMIN, Role.STAFF), orderController.assignRider);
router.get('/:id', auth(Role.ADMIN, Role.CUSTOMER, Role.RIDER, Role.STAFF), orderController.getOrderById);


export const orderRoutes = router;