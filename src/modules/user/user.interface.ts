import { Role } from "../../../generated/prisma/enums"

export interface ICreateUserInput {
    name?: string,
    email: string,
    password: string,
    phone?: string
}

export interface IUserResponse {
    id: string,
    name: string | null,
    email: string,
    role: Role,
    createdAt: Date,
    updatedAt: Date
}