import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser } from "./auth.interface";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken"
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
};

const refreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret);

    if (!verifiedRefreshToken.success) {
        throw new Error(verifiedRefreshToken.error)
    }

    const { id } = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    })
    // if (user.status === "BANNED") {
    //     throw new Error("User is Banned")
    // }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(jwtPayload, config.jwt_access_secret, config.jwt_access_expires_in as SignOptions);
    return { accessToken }
}

export const authService = {
    loginUser,
    refreshToken
}