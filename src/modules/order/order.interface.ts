import { DeliveryZone, OrderStatus } from "../../../generated/prisma/enums"

export interface IOrderItemPayload {
    menuItemId: string,
    quantity: number
}

export interface ICreateOrderPayload {
    deliveryAddress: string,
    contactPhone: string,
    orderNotes?: string,
    items: IOrderItemPayload[],
    deliveryZone: DeliveryZone
}

export interface IOrderFilterQuery {
    status?: OrderStatus,
    deliveryZone?: DeliveryZone
}

export interface IUpdateOrderStatusPayload {
    status: OrderStatus
}

export interface IAssignRiderPayload {
    riderId: string
}