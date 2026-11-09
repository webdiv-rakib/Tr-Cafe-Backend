import httpStatus from 'http-status';
import { Prisma } from '../../generated/prisma/client';
import { NextFunction, Request, Response } from 'express';
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log("Error: ", err);

    let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = err.message || "Internal Server Error";
    let errorName = err.name || "Internal Server Error";

    if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = httpStatus.BAD_REQUEST;
        errorMessage = "You have provided an incorrect field type or missing field";
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = httpStatus.BAD_REQUEST;
            errorMessage = "Duplicate Key Error (A record with this value already exists)";
        } else if (err.code === "P2003") {
            statusCode = httpStatus.BAD_REQUEST;
            errorMessage = "Foreign Key Constraint Failed";
        } else if (err.code === "P2025") {
            statusCode = httpStatus.BAD_REQUEST;
            errorMessage = "An operation failed because a required record was not found";
        }
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        if (err.errorCode === "P1000") {
            statusCode = httpStatus.UNAUTHORIZED;
            errorMessage = "Authentication failed against database server";
        } else if (err.errorCode === "P1001") {
            statusCode = httpStatus.BAD_REQUEST;
            errorMessage = "Can't reach database server";
        }
    } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = "Error occurred during query execution";
    }
    // 👇 ADD THIS BLOCK: Handle manual custom errors thrown from services (like "User already exists")
    else if (err instanceof Error && err.name === "Error") {
        statusCode = httpStatus.BAD_REQUEST; // Treat manual service errors as 400 Bad Request
    }

    const finalStatusCode = statusCode || httpStatus.INTERNAL_SERVER_ERROR;

    res.status(finalStatusCode).json({
        success: false,
        statusCode: finalStatusCode,
        name: errorName,
        message: errorMessage,
        error: err.stack,
    });
};