import { Role } from "../../../generated/prisma/enums"

export interface ICreateUserInput {
    name?: string,
    email: string,
    password: string,
    phone?: string,
    role?: Role
}

export interface IUserResponse {
    id: string,
    name: string | null,
    email: string,
    role: Role,
    createdAt: Date,
    updatedAt: Date
}

export interface IUpdateProfile {
    name?: string,
    phone?: string,
    image?: string,
}

export interface IChangePassword {
    oldPassword: string,
    newPassword: string,
}