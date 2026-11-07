import { prisma } from "../../lib/prisma"
import { ICreateMenuItem } from "./menuItem.interface"

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
}

export const menuItemService = {
    createMenuItem
}