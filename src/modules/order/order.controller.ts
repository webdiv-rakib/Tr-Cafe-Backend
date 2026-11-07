import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { orderService } from "./order.service";
import { DeliveryZone, OrderStatus, Role } from '../../../generated/prisma/enums';

const createOrder = catchAsync(
    async (req, res, next) => {
        const id = req.user?.id as string;
        const payload = req.body
        const result = await orderService.createOrder(id, payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Order placed successfully',
            data: result,
        });
    }
);

const getMyOrders = catchAsync(
    async (req, res, next) => {
        const id = req.user?.id as string;
        const result = await orderService.getMyOrders(id);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Orders retrieved successfully',
            data: result,
        });
    }
);

const getOrderById = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user?.id as string;
        const role = req.user?.role as Role;

        const result = await orderService.getOrderById(id as string, userId, role);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Order retrieved successfully',
            data: result,
        });
    }
);

const getAllOrders = catchAsync(
    async (req, res, next) => {
        const filters = {
            status: req.query.status as OrderStatus | undefined,
            deliveryZone: req.query.deliveryZone as DeliveryZone | undefined,
        };

        const result = await orderService.getAllOrders(filters);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'All orders retrieved successfully',
            data: result,
        });
    }
);

const updateOrderStatus = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const userId = req.user?.id as string;
        const role = req.user?.role as Role;
        const payload = req.body;

        const result = await orderService.updateOrderStatus(id as string, userId, role, payload);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Order status updated successfully',
            data: result,
        });
    }
);

const assignRider = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const payload = req.body;

        const result = await orderService.assignRider(id as string, payload);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Rider assigned successfully and order marked as OUT_FOR_DELIVERY',
            data: result,
        });
    }
);

const getAssignedDeliveries = catchAsync(
    async (req, res, next) => {
        const riderId = req.user?.id as string;
        const status = req.query.status as OrderStatus | undefined;

        const result = await orderService.getAssignedDeliveries(riderId, status);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Assigned deliveries retrieved successfully',
            data: result,
        });
    }
)

export const orderController = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    assignRider,
    getAssignedDeliveries
}