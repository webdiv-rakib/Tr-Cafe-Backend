import { prisma } from "../../lib/prisma";
import bcrypt from 'bcryptjs';
import config from '../../config';
import { ICreateUserInput, IUserResponse } from "./user.interface";

const createUser = async (payload: ICreateUserInput): Promise<IUserResponse> => {
    const { name, email, password, phone } = payload;

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
            role: 'CUSTOMER',
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

export const userService = {
    createUser
}