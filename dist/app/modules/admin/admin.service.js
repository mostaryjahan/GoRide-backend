"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.generateAdminReport = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_model_1 = require("../user/user.model");
const user_interface_1 = require("../user/user.interface");
const ride_model_1 = require("../ride/ride.model");
const driver_model_1 = require("../driver/driver.model");
const ride_interface_1 = require("../ride/ride.interface");
const approveDriver = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield user_model_1.User.findById(userId);
    if (!existingUser) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (existingUser.role !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not a driver");
    }
    if (existingUser.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver is already approved");
    }
    existingUser.isApproved = true;
    yield existingUser.save();
    return existingUser;
});
const suspendDriver = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield user_model_1.User.findById(userId);
    if (!existingUser) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (existingUser.role !== user_interface_1.Role.DRIVER) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not a driver");
    }
    if (!existingUser.isApproved) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver is not approved yet");
    }
    existingUser.isApproved = false;
    yield existingUser.save();
    return existingUser;
});
const blockUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield user_model_1.User.findById(userId);
    if (!existingUser) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (existingUser.isBlock === user_interface_1.IsBlock.BLOCK) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already blocked");
    }
    existingUser.isBlock = user_interface_1.IsBlock.BLOCK;
    yield existingUser.save();
    return existingUser;
});
const unblockUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield user_model_1.User.findById(userId);
    if (!existingUser) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (existingUser.isBlock === user_interface_1.IsBlock.UNBLOCK) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already unblocked");
    }
    existingUser.isBlock = user_interface_1.IsBlock.UNBLOCK;
    yield existingUser.save();
    return existingUser;
});
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.User.find().select("-password");
});
const getAllDrivers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield driver_model_1.Driver.find().populate("user", "-password");
});
const getAllRides = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield ride_model_1.Ride.find()
        .populate("rider", "-password")
        .populate({
        path: "driver",
        populate: {
            path: "user",
            select: "-password",
        },
    });
});
const generateAdminReport = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const [totalUsers, totalDrivers, totalRides, completedRides, ongoingRides, earningsData,] = yield Promise.all([
        user_model_1.User.countDocuments(),
        driver_model_1.Driver.countDocuments(),
        ride_model_1.Ride.countDocuments(),
        ride_model_1.Ride.countDocuments({ status: ride_interface_1.RideStatus.COMPLETED }),
        ride_model_1.Ride.countDocuments({
            status: { $in: [ride_interface_1.RideStatus.PICKED_UP, ride_interface_1.RideStatus.IN_TRANSIT] },
        }),
        ride_model_1.Ride.aggregate([
            { $match: { status: ride_interface_1.RideStatus.COMPLETED } },
            { $group: { _id: null, total: { $sum: "$fare" } } },
        ]),
    ]);
    return {
        totalUsers,
        totalDrivers,
        totalRides,
        completedRides,
        ongoingRides,
        totalEarnings: ((_a = earningsData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
    };
});
exports.generateAdminReport = generateAdminReport;
exports.AdminService = {
    approveDriver,
    suspendDriver,
    blockUser,
    unblockUser,
    getAllUsers,
    getAllDrivers,
    getAllRides,
    generateAdminReport: exports.generateAdminReport,
};
