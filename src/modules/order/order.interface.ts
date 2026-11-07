import { DeliveryZone } from "../../../generated/prisma/enums"

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