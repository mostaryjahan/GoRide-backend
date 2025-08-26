"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
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
exports.DriverController = exports.updateRideStatus = exports.rejectRide = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const driver_service_1 = require("./driver.service");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const applyToBeDriver = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { userId } = user;
    const driver = yield driver_service_1.DriverService.applyToBeDriver(userId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Driver application submitted successfully.",
        data: driver,
    });
}));
const getAvailableRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rides = yield driver_service_1.DriverService.getAvailableRides();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Available ride requests retrieved successfully",
        data: rides,
    });
}));
const acceptRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rideId = req.params.id;
    const user = req.user;
    const { userId } = user;
    const result = yield driver_service_1.DriverService.acceptRide(rideId, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride accepted successfully",
        data: result,
    });
}));
exports.rejectRide = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    const { userId } = user;
    const result = yield driver_service_1.DriverService.rejectRide(id, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride request rejected successfully",
        data: result,
    });
}));
exports.updateRideStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    const { userId } = user;
    const result = yield driver_service_1.DriverService.updateRideStatus(id, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride status updated successfully",
        data: result,
    });
}));
const getRideHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { userId } = user;
    const result = yield driver_service_1.DriverService.getRideHistory(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Ride history retrieved successfully",
        data: result,
    });
}));
const updateDriverStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const { isOnline } = req.body;
    const result = yield driver_service_1.DriverService.updateDriverStatus(userId, isOnline);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver status updated successfully",
        data: result,
    });
}));
const getDriverStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const result = yield driver_service_1.DriverService.getDriverStats(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver stats retrieved successfully",
        data: result,
    });
}));
const getDriverEarnings = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const result = yield driver_service_1.DriverService.getDriverEarnings(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Driver earnings retrieved successfully",
        data: result,
    });
}));
const getActiveRides = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const result = yield driver_service_1.DriverService.getActiveRides(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Active rides retrieved successfully",
        data: result,
    });
}));
exports.DriverController = {
    applyToBeDriver,
    getAvailableRides,
    acceptRide,
    rejectRide: exports.rejectRide,
    updateRideStatus: exports.updateRideStatus,
    getRideHistory,
    updateDriverStatus,
    getDriverStats,
    getDriverEarnings,
    getActiveRides,
};
