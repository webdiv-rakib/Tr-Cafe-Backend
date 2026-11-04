import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser } from "./auth.interface";

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
    return user
}

export const authService = {
    loginUser
}