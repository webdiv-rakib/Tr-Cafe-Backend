import { prisma } from "../../lib/prisma";
import bcrypt from 'bcryptjs';
import config from '../../config';
import { ICreateUserInput, IUpdateProfile, IUserResponse } from "./user.interface";
import { Role } from "../../../generated/prisma/enums";

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
}

export const userService = {
    createUser,
    getUserProfile,
    updateProfile
}