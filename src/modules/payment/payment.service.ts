import { OrderStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
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

const getPaymentByOrderId = async (orderId: string, userId: string, role: Role) => {
    const payment = await prisma.payment.findUniqueOrThrow({
        where: { orderId },
        include: {
            order: {
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    totalAmount: true,
                },
            },
        },
    });

    // Customer ownership guard
    if (role === Role.CUSTOMER && payment.order.userId !== userId) {
        throw new Error('Forbidden: You can only view payment details for your own order');
    }

    return {
        ...payment,
        amount: Number(payment.amount),
    };
};

const getRevenueSummary = async () => {
    const totalPaidAggregate = await prisma.payment.aggregate({
        where: {
            status: PaymentStatus.PAID,
        },
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    // 2. Calculate pending payments volume (e.g. active COD orders on delivery)
    const pendingAggregate = await prisma.payment.aggregate({
        where: {
            status: PaymentStatus.PENDING,
        },
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    // 3. Breakdown by payment provider for completed (PAID) sales
    const providerBreakdown = await prisma.payment.groupBy({
        by: ['provider'],
        where: {
            status: PaymentStatus.PAID,
        },
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    // 4. Breakdown by payment status (PAID, PENDING, FAILED)
    const statusBreakdown = await prisma.payment.groupBy({
        by: ['status'],
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    return {
        totalRevenue: Number(totalPaidAggregate._sum.amount || 0),
        totalCompletedTransactions: totalPaidAggregate._count.id,
        pendingRevenue: Number(pendingAggregate._sum.amount || 0),
        pendingTransactions: pendingAggregate._count.id,
        byProvider: providerBreakdown.map((item) => ({
            provider: item.provider,
            totalAmount: Number(item._sum.amount || 0),
            transactionCount: item._count.id,
        })),
        byStatus: statusBreakdown.map((item) => ({
            status: item.status,
            totalAmount: Number(item._sum.amount || 0),
            count: item._count.id,
        })),
    };
};

export const paymentService = {
    initiatepayment,
    updatePaymentStatus,
    getPaymentByOrderId,
    getRevenueSummary
}