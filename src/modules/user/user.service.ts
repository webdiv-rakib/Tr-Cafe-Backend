import { prisma } from "../../lib/prisma";
import bcrypt from 'bcryptjs';
import config from '../../config';
import { IChangePassword, ICreateUserInput, IUpdateProfile, IUserResponse } from "./user.interface";
import { Role } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/browser";

const createUser = async (payload: ICreateUserInput): Promise<IUserResponse> => {
    const { name, email, password, phone, role } = payload;

    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const isUserExist = await prisma.user.findUnique({
        where: { email },
    });

    if (isUserExist) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds)
    );

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone,
            role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return createdUser;
};

const getUserProfile = async (id: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id
        },
        omit: {
            password: true
        }
    })
    return user
};

const updateProfile = async (id: string, payload: IUpdateProfile) => {
    const { name, phone, image } = payload
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });
    const updateUser = await prisma.user.update({
        where: {
            id
        },
        data: {
            name,
            phone,
            image
        },
        omit: {
            password: true
        }
    })
    return updateUser
};

const changePassword = async (id: string, payload: IChangePassword) => {
    const { oldPassword, newPassword } = payload;
    if (!oldPassword || !newPassword) {
        throw new Error("Both old password and new password are required")
    };
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });

    if (!user.password) {
        throw new Error('This account uses social login and has no password to change');
    };

    const isOldPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatched) {
        throw new Error("Old password does not match")
    };

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
        throw new Error('New password must be different from the old password');
    };

    const hashedNewPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
    await prisma.user.update({
        where: {
            id
        },
        data: {
            password: hashedNewPassword
        }
    });
    return null
};

const getAllUsers = async (query: { role?: Role; searchTerm?: string }) => {
    const { role, searchTerm } = query;

    const andConditions: Prisma.UserWhereInput[] = [];

    // Filter by role (e.g., ?role=RIDER or ?role=STAFF)
    if (role) {
        andConditions.push({
            role: role as Role,
        });
    }

    // Optional search by name, email, or phone
    if (searchTerm) {
        andConditions.push({
            OR: [
                {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    phone: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            ],
        });
    }

    const whereConditions: Prisma.UserWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
        where: whereConditions,
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return users;
};

export const userService = {
    createUser,
    getUserProfile,
    updateProfile,
    changePassword,
    getAllUsers
}