import { DeliveryZone, OrderStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IAssignRiderPayload, ICreateOrderPayload, IOrderFilterQuery, IUpdateOrderStatusPayload } from "./order.interface";

const createOrder = async (userId: string, payload: ICreateOrderPayload) => {
    const { deliveryAddress, contactPhone, orderNotes, items, deliveryZone } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Order must include at least one item");
    }

    const result = await prisma.$transaction(async (tx) => {
        const itemIds = items.map((item) => item.menuItemId);
        const menuItems = await tx.menuItem.findMany({
            where: {
                id: { in: itemIds },
            },
        });

        if (menuItems.length !== itemIds.length) {
            throw new Error("One or more selected menu items do not exist");
        }

        let itemsTotal = 0;

        const orderItemsData = items.map((cartItem) => {
            const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);

            if (!menuItem) {
                throw new Error(`Menu item not found for ID: ${cartItem.menuItemId}`);
            }

            if (!menuItem.isAvailable) {
                throw new Error(`Item "${menuItem.name}" is currently out of stock`);
            }

            if (cartItem.quantity <= 0) {
                throw new Error(`Invalid quantity for item "${menuItem.name}"`);
            }

            const itemTotal = Number(menuItem.price) * cartItem.quantity;
            itemsTotal += itemTotal;

            return {
                menuItemId: menuItem.id,
                quantity: cartItem.quantity,
                unitPrice: Number(menuItem.price),
            };
        });

        const deliveryFee = 20; // In-house DIU area delivery charge
        const totalAmount = itemsTotal + deliveryFee;

        const order = await tx.order.create({
            data: {
                userId,
                deliveryAddress,
                contactPhone,
                orderNotes,
                totalAmount,
                deliveryZone,
                status: OrderStatus.PENDING,
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        // Return the order with explicit payable numbers
        return {
            ...order,
            pricing: {
                itemsTotal,
                deliveryFee,
                totalAmountToPay: totalAmount,
            },
            items: order.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.unitPrice) * item.quantity,
            })),
        };
    });

    return result;
};

const getMyOrders = async (userId: string) => {
    const orders = await prisma.order.findMany({
        where: {
            userId,
        },
        include: {
            items: {
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                        },
                    },
                },
            },
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            payment: {
                select: {
                    id: true,
                    status: true,
                    provider: true,
                    amount: true,
                    transactionId: true
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Format line item subtotals for each order
    const formattedOrders = orders.map((order) => {
        return {
            ...order,
            totalAmount: Number(order.totalAmount),
            items: order.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.unitPrice) * item.quantity,
            })),
        };
    });
    return formattedOrders;
};

const getOrderById = async (id: string, userId: string, role: Role) => {
    const order = await prisma.order.findUniqueOrThrow({
        where: {
            id: id,
        },
        include: {
            items: {
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            price: true,
                        },
                    },
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            payment: {
                select: {
                    id: true,
                    status: true,
                    provider: true,
                    amount: true,
                    transactionId: true,
                },
            },
        },
    });

    // Guard: Customers can ONLY access their own orders
    if (role === Role.CUSTOMER && order.userId !== userId) {
        throw new Error('Forbidden: You can only view your own order');
    }

    // Guard: If a rider accesses, ensure it is assigned to them (unless staff/admin)
    if (role === Role.RIDER && order.riderId !== userId) {
        throw new Error('Forbidden: This order is not assigned to you');
    }

    const formattedOrder = {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.unitPrice) * item.quantity,
        })),
    };
    return formattedOrder;
};

const getAllOrders = async (filters: IOrderFilterQuery) => {
    const { status, deliveryZone } = filters;

    const orders = await prisma.order.findMany({
        where: {
            ...(status && { status }),
            ...(deliveryZone && { deliveryZone }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            payment: {
                select: {
                    id: true,
                    status: true,
                    provider: true,
                    amount: true,
                    transactionId: true,
                },
            },
            items: {
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            imageUrl: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const formattedOrders = orders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.unitPrice) * item.quantity,
        })),
    }));

    return formattedOrders;
}

const updateOrderStatus = async (orderId: string, userId: string, role: Role, payload: IUpdateOrderStatusPayload) => {
    const { status: targetStatus } = payload;

    if (!targetStatus) {
        throw new Error('New order status is required');
    }

    // 1. Verify order exists
    const existingOrder = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
    });

    const currentStatus = existingOrder.status;

    // 2. Prevent updates on finalized orders
    if (currentStatus === OrderStatus.DELIVERED) {
        throw new Error('Order is already marked as DELIVERED and cannot be modified');
    }

    if (currentStatus === OrderStatus.CANCELLED) {
        throw new Error('Order has been CANCELLED and cannot be modified');
    }

    // 3. Role-specific restrictions
    if (role === Role.RIDER) {
        // Riders can only update orders assigned directly to them
        if (existingOrder.riderId !== userId) {
            throw new Error('Forbidden: You can only update orders assigned to you');
        }

        // Riders can only mark orders as OUT_FOR_DELIVERY or DELIVERED
        if (
            targetStatus !== OrderStatus.OUT_FOR_DELIVERY &&
            targetStatus !== OrderStatus.DELIVERED
        ) {
            throw new Error('Riders can only change status to OUT_FOR_DELIVERY or DELIVERED');
        }
    }

    // 4. Update the order status
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: targetStatus,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    });

    return updatedOrder;
};

const assignRider = async (orderId: string, payload: IAssignRiderPayload) => {
    const { riderId } = payload;

    if (!riderId) {
        throw new Error('riderId is required');
    }

    // 1. Verify that the order exists
    const existingOrder = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
    });

    // 2. Prevent assignment if the order is already cancelled or delivered
    if (existingOrder.status === OrderStatus.CANCELLED) {
        throw new Error('Cannot assign a rider to a CANCELLED order');
    }

    if (existingOrder.status === OrderStatus.DELIVERED) {
        throw new Error('Order is already DELIVERED');
    }

    // 3. Verify that the assigned user exists and has the RIDER role
    const rider = await prisma.user.findUniqueOrThrow({
        where: { id: riderId },
    });

    if (rider.role !== Role.RIDER) {
        throw new Error('Selected user does not have the RIDER role');
    }

    // 4. Update the order with riderId and mark OUT_FOR_DELIVERY
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            riderId,
            status: OrderStatus.OUT_FOR_DELIVERY,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            rider: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            items: {
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            price: true,
                        },
                    },
                },
            },
        },
    });

    return updatedOrder;
}

export const orderService = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    assignRider
}