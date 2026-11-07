export interface ICreateMenuItem {
    name: string,
    description?: string,
    price: number,
    imageUrl: string,
    isAvailable?: boolean,
    categoryId: string
}