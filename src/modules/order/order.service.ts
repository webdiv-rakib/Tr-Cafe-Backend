import { DeliveryZone, OrderStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateOrderPayload, IOrderFilterQuery } from "./order.interface";

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

export const orderService = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders
}