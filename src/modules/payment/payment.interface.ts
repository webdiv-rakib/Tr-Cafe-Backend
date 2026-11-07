import { PaymentStatus } from "../../../generated/prisma/enums"

export interface IInitiatePaymentPayload {
    orderId: string,
    provider: string,
    transactionId?: string
}

export interface IUpdatePaymentStatusPayload {
    status: PaymentStatus,
    transactionId?: string
}