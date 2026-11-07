import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { menuItemService } from "./menuItem.service";

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

export const menuItemController = {
    createMenuItem
}