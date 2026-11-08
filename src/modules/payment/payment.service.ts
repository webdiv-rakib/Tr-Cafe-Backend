import Stripe from "stripe";
import { OrderStatus, PaymentStatus, Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
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

//-----------------------------------
// Stripe
const createStripeCheckoutSession = async (userId: string, orderId: string) => {
    // 1. Fetch order with items and user
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
            user: {
                select: {
                    email: true,
                },
            },
            payment: true,
        },
    });
    // 2. Ownership & validation checks
    if (order.userId !== userId) {
        throw new Error('Forbidden: You can only pay for your own order');
    };
    if (order.payment?.status === PaymentStatus.PAID) {
        throw new Error('This order has already been paid');
    };

    // 3. Format items for Stripe (Stripe requires amount in poisha/cents -> multiply by 100)
    const lineItems = order.items.map((item) => ({
        price_data: {
            currency: 'bdt',
            product_data: {
                name: item.menuItem.name,
                images: item.menuItem.imageUrl ? [item.menuItem.imageUrl] : [],
            },
            unit_amount: Math.round(Number(item.unitPrice) * 100),
        },
        quantity: item.quantity,
    }));
    // Add DIU delivery fee (20 BDT)
    lineItems.push({
        price_data: {
            currency: 'bdt',
            product_data: {
                name: 'DIU Campus Delivery Fee',
                images: []
            },
            unit_amount: 20 * 100,
        },
        quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: order.user.email,
        client_reference_id: orderId,
        line_items: lineItems,
        metadata: {
            orderId: orderId,
            userId
        },
        success_url: `${config.app_url}/payment?success=true&sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app_url}/payment?success=false&orderId=${orderId}`
    });
    // 5. Upsert payment record matching your Prisma model
    await prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
            orderId: order.id,
            amount: order.totalAmount,
            provider: 'STRIPE',
            status: PaymentStatus.PENDING,
            transactionId: session.id,
        },
        update: {
            provider: 'STRIPE',
            amount: order.totalAmount,
            status: PaymentStatus.PENDING,
            transactionId: session.id,
        },
    });
    return {
        paymentUrl: session.url,
        sessionId: session.id
    }


};

// const handleStripeWebhook = async (payload: Buffer, signature: string) => {
//     const webhookSecret = config.stripe_webhook_secret;

//     if (!webhookSecret) {
//         throw new Error('STRIPE_WEBHOOK_SECRET is not configured in .env');
//     }

//     // 1. Verify event authenticity with Stripe SDK
//     const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

//     // 2. Handle the successful checkout session event
//     if (event.type === 'checkout.session.completed') {
//         const session = event.data.object as Stripe.Checkout.Session;
//         const orderId = session.metadata?.orderId;
//         const paymentIntentId = (session.payment_intent as string) || session.id;

//         if (orderId) {
//             await prisma.$transaction(async (tx) => {
//                 // Mark payment as PAID
//                 await tx.payment.update({
//                     where: { orderId },
//                     data: {
//                         status: PaymentStatus.PAID,
//                         transactionId: paymentIntentId,
//                     },
//                 });

//                 // Advance order to PREPARING
//                 await tx.order.update({
//                     where: { id: orderId },
//                     data: {
//                         status: OrderStatus.PREPARING,
//                     },
//                 });
//             });
//         }
//     }

//     return { received: true };
// };

const handleStripeWebhook = async (payload: Buffer, signature: string) => {
    const webhookSecret = config.stripe_webhook_secret;

    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured in .env');
    }

    // 1. Verify event authenticity with Stripe SDK
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    // console.log('🔔 Webhook received! Event type:', event.type);

    // 2. Handle the successful checkout session event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const paymentIntentId = (session.payment_intent as string) || session.id;

        // console.log('✅ Checkout completed for Order ID:', orderId);

        if (orderId) {
            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { orderId },
                    data: {
                        status: PaymentStatus.PAID,
                        transactionId: paymentIntentId,
                    },
                });

                // await tx.order.update({
                //     where: { id: orderId },
                //     data: {
                //         status: OrderStatus.PREPARING,
                //     },
                // });
            });
            // console.log('🎉 Database updated to PAID and PREPARING!');
        }
    }

    return { received: true };
};
export const paymentService = {
    initiatepayment,
    updatePaymentStatus,
    getPaymentByOrderId,
    getRevenueSummary,
    createStripeCheckoutSession,
    handleStripeWebhook
}