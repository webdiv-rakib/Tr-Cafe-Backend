import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { menuItemService } from "./menuItem.service";
import { IMenuItemFilterRequest } from './menuItem.interface';

const createMenuItem = catchAsync(
    async (req, res, next) => {
        const payload = req.body;
        const result = await menuItemService.createMenuItem(payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Menu item created successfully',
            data: result,
        });
    }
);

const getAllMenuItems = catchAsync(
    async (req, res, next) => {
        const filters: IMenuItemFilterRequest = {
            searchTerm: req.query.searchTerm as string,
            categoryId: req.query.categoryId as string,
            isAvailable: req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined
        }

        const result = await menuItemService.getAllMenuItems(filters);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Menu items retrieved successfully',
            data: result,
        });
    }
);

const getMenuItemById = catchAsync(
    async (req, res, next) => {
        const { id } = req.params
        const result = await menuItemService.getMenuItemById(id as string);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Menu item retrieved successfully',
            data: result,
        });
    }
);

const updateMenuItem = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const payload = req.body;
        const result = await menuItemService.updateMenuItem(id as string, payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Menu item updated successfully',
            data: result,
        });
    }
);

const deleteMenuItem = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const result = await menuItemService.deleteMenuItem(id as string)
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Menu item deleted successfully',
            data: result,
        });
    }
);

const getSpecialMenuItems = catchAsync(
    async (req, res, next) => {
        const result = await menuItemService.getSpecialMenuItems();
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Special menu items retrieved successfully',
            data: result,
        });
    }
);

const toggleItemSpecialStatus = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const result = await menuItemService.toggleItemSpecialStatus(id as string);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Menu item special status toggled successfully',
            data: result,
        });
    }
);

export const menuItemController = {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    getSpecialMenuItems,
    toggleItemSpecialStatus
}