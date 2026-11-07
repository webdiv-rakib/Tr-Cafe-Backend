import { DeliveryZone, OrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateOrderPayload } from "./order.interface";

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

export const orderService = {
    createOrder
}