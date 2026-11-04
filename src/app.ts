import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors"
import config from "./config";
import { prisma } from "./lib/prisma";

const app: Application = express();
// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: config.app_url,
    credentials: true
}))


app.get('/', async (req: Request, res: Response) => {
    const user = await prisma.user.findMany(); //add this line with clg
    console.log(user);
    res.send("TR-Cafe-Backend")
})

export default app;