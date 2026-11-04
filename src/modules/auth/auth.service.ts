import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser } from "./auth.interface";
import jwt, { SignOptions } from "jsonwebtoken"
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";

const loginUser = async (payload: ILoginUser) => { //payload for email,pass
    const { email, password } = payload;
    // check if the user exitst
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email
        },
    });

    if (!user) {
        throw new Error('User Not Found')
    };

    if (!user.password) {
        throw new Error('This account was created via social login. Please sign in with Google/OAuth.');
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        throw new Error('Invalid credentials');
    }
    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }
    const accessToken = jwtUtils.createToken(jwtPayload, config.jwt_access_secret, config.jwt_access_expires_in as SignOptions);
    const refreshToken = jwtUtils.createToken(jwtPayload, config.jwt_refresh_secret, config.jwt_refresh_expires_in as SignOptions);
    return {
        accessToken,
        refreshToken
    }
}

export const authService = {
    loginUser
}