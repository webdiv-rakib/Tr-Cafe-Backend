import { PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IInitiatePaymentPayload } from "./payment.interface"

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
}

export const paymentService = {
    initiatepayment
}