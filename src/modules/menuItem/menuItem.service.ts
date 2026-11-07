import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma"
import { ICreateMenuItem, IMenuItemFilterRequest } from "./menuItem.interface"

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
}

export const menuItemService = {
    createMenuItem,
    getAllMenuItems
}