import { OrderStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IInitiatePaymentPayload, IUpdatePaymentStatusPayload } from "./payment.interface"

const initiatepayment = async (userId: string, payload: IInitiatePaymentPayload) => {
    const { orderId, provider, transactionId } = payload;

    if (!orderId || !provider) {
        throw new Error('orderId and provider are required');
    }

    // 1. Verify order exists and belongs to the customer
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { payment: true },
    });

    if (order.userId !== userId) {
        throw new Error('Forbidden: You can only initiate payment for your own order');
    }

    // 2. Enforce 1-to-1 constraint: check if payment record already exists
    if (order.payment) {
        throw new Error('A payment record already exists for this order');
    }

    // 3. Create payment record using order's totalAmount
    const payment = await prisma.payment.create({
        data: {
            orderId,
            amount: order.totalAmount,
            provider: provider.toUpperCase(),
            transactionId: transactionId || null,
            status: PaymentStatus.PENDING,
        },
        include: {
            order: {
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    deliveryZone: true,
                    deliveryAddress: true,
                },
            },
        },
    });

    return {
        ...payment,
        amount: Number(payment.amount),
    };
};

const updatePaymentStatus = async (paymentId: string, payload: IUpdatePaymentStatusPayload) => {
    const { status, transactionId } = payload;

    const existingPayment = await prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { order: true },
    });

    // Run in a transaction so if marked PAID, order status syncs when applicable
    const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
                status,
                ...(transactionId && { transactionId }),
            },
        });

        // If payment is confirmed as PAID and rider was delivering, mark DELIVERED
        if (
            status === PaymentStatus.PAID &&
            existingPayment.order.status === OrderStatus.OUT_FOR_DELIVERY
        ) {
            await tx.order.update({
                where: { id: existingPayment.orderId },
                data: {
                    status: OrderStatus.DELIVERED,
                },
            });
        }

        return updatedPayment;
    });

    return {
        ...result,
        amount: Number(result.amount),
    };
};

export const paymentService = {
    initiatepayment,
    updatePaymentStatus
}