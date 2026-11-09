import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma"
import { ICreateMenuItem, IMenuItemFilterRequest, IUpdateMenuItem } from "./menuItem.interface"

const createMenuItem = async (payload: ICreateMenuItem) => {
    const { name, description, price, imageUrl, isAvailable, categoryId } = payload;
    await prisma.category.findUniqueOrThrow({
        where: {
            id: categoryId
        }
    });

    const menuItem = await prisma.menuItem.create({
        data: {
            name,
            description,
            price,
            imageUrl,
            isAvailable,
            categoryId
        },
        include: {
            category: true
        }
    });
    return menuItem
};

const getAllMenuItems = async (filters: IMenuItemFilterRequest) => {
    const { searchTerm, categoryId, isAvailable, minPrice, maxPrice } = filters
    const andConditions: Prisma.MenuItemWhereInput[] = [];

    // search by name or description
    if (searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
        })
    }

    // filter by category
    if (categoryId) {
        andConditions.push({ categoryId })
    };

    // filter by availability status
    if (typeof isAvailable === 'boolean') {
        andConditions.push({ isAvailable })
    }

    // filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
        andConditions.push({
            price: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
            },
        })
    }

    const whereConditions: Prisma.MenuItemWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
    const menuItems = await prisma.menuItem.findMany({
        where: whereConditions,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return menuItems
};

const getMenuItemById = async (id: string) => {
    const menuItem = await prisma.menuItem.findUniqueOrThrow({
        where: {
            id
        },
        include: {
            category: true
        }
    })
    return menuItem
};

const updateMenuItem = async (id: string, payload: IUpdateMenuItem) => {
    const { name, description, price, imageUrl, isAvailable, categoryId } = payload
    await prisma.menuItem.findUniqueOrThrow({
        where: {
            id
        }
    });
    if (categoryId) {
        await prisma.category.findUniqueOrThrow({
            where: {
                id: categoryId
            }
        })
    };
    const updatedMenuItem = await prisma.menuItem.update({
        where: {
            id
        },
        data: {
            name,
            description,
            price,
            imageUrl,
            isAvailable,
            categoryId
        },
        include: {
            category: true
        }
    })
    return updatedMenuItem

};

const deleteMenuItem = async (id: string) => {
    await prisma.menuItem.findUniqueOrThrow({
        where: {
            id
        }
    });
    const deletedMenuItem = await prisma.menuItem.delete({
        where: {
            id
        }
    });
    return deletedMenuItem
};

const getSpecialMenuItems = async () => {
    return await prisma.menuItem.findMany({
        where: {
            isSpecial: true,
            isAvailable: true,
        },
        include: {
            category: true,
        },
    });
};

const toggleItemSpecialStatus = async (itemId: string) => {
    const item = await prisma.menuItem.findUniqueOrThrow({
        where: { id: itemId },
    });

    return await prisma.menuItem.update({
        where: { id: itemId },
        data: {
            isSpecial: !item.isSpecial, // Toggles true <-> false
        },
    });
};

export const menuItemService = {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    getSpecialMenuItems,
    toggleItemSpecialStatus
}