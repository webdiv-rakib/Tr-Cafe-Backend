import { prisma } from "../../lib/prisma";
import { ICreateCategory, IUpdateCategory } from "./category.interface";

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

const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: {
            id
        },
        include: {
            menuItems: true
        }
    });
    return category
};

const updateCategory = async (id: string, payload: IUpdateCategory) => {
    const { name, slug, imageUrl } = payload
    await prisma.category.findUniqueOrThrow({
        where: {
            id
        }
    });
    let updatedSlug = slug
    if (!slug && name) {
        updatedSlug = name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
    }
    const updatedCategory = await prisma.category.update({
        where: {
            id
        },
        data: {
            name,
            slug,
            imageUrl
        }
    });
    return updatedCategory
};

const deleteCategory = async (id: string) => {
    await prisma.category.findUniqueOrThrow({
        where: {
            id
        }
    });
    const deleteCategory = await prisma.category.delete({
        where: {
            id
        }
    });
    return deleteCategory
};

export const categoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
}