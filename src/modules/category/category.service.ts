import { prisma } from "../../lib/prisma";
import { ICreateCategory } from "./category.interface";

const createCategory = async (payload: ICreateCategory) => {
    const { name, imageUrl } = payload
    const slug = payload.slug || payload.name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');

    const isExist = await prisma.category.findUnique({
        where: { slug }
    });

    if (isExist) {
        throw new Error('Category with this name or slug already exists');
    };

    const category = await prisma.category.create({
        data: {
            name,
            slug,
            imageUrl
        }
    });
    return category
};

const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { menuItems: true }, // Returns count of menu items in this category
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return categories;
};

export const categoryService = {
    createCategory,
    getAllCategories
}