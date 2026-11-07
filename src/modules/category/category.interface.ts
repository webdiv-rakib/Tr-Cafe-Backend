export interface ICreateCategory {
    name: string,
    slug?: string,
    imageUrl?: string
}

export interface IUpdateCategory {
    name?: string,
    slug?: string,
    imageUrl?: string
}