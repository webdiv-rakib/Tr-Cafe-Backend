import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(
    async (req, res, next) => {
        const payload = req.body
        const result = await categoryService.createCategory(payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Category created successfully',
            data: result,
        });
    }
);

const getAllCategories = catchAsync(
    async (req, res, next) => {
        const result = await categoryService.getAllCategories();

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Categories retrieved successfully',
            data: result,
        });
    }
)

export const categoryController = {
    createCategory,
    getAllCategories
}