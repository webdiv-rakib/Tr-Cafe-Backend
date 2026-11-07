export interface ICreateMenuItem {
    name: string,
    description?: string,
    price: number,
    imageUrl: string,
    isAvailable?: boolean,
    categoryId: string
}

export interface IMenuItemFilterRequest {
    searchTerm?: string,
    categoryId?: string,
    isAvailable?: boolean,
    minPrice?: number,
    maxPrice?: number
}

export interface IUpdateMenuItem {
    name?: string,
    description?: string,
    price?: number,
    imageUrl?: string,
    isAvailable?: boolean,
    categoryId?: string
}