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
exports.RideController = void 0;
const ride_service_1 = require("./ride.service");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createRide = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const rider = req.user;
    const { userId } = rider;
    // console.log('Ride request data:', req.body);
    const rideData = req.body;
    const result = yield ride_service_1.RideService.createRide(userId, rideData);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: 'Ride requested successfully!',
        data: result,
    });
}));
const cancelRide = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const rideId = req.params.id;
    const rider = req.user;
    const { userId: riderId } = rider;
    const result = yield ride_service_1.RideService.cancelRide(rideId, riderId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: 'Ride cancelled successfully',
        data: result,
    });
}));
const getMyRides = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const rider = req.user;
    const { userId: riderId } = rider;
    const result = yield ride_service_1.RideService.getMyRides(riderId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: 'Ride history fetched successfully',
        data: result,
    });
}));
const getSingleRide = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const rideId = req.params.id;
    const rider = req.user;
    const { userId: riderId } = rider;
    const result = yield ride_service_1.RideService.getSingleRide(rideId, riderId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: 'Ride fetched successfully',
        data: result,
    });
}));
exports.RideController = {
    createRide,
    cancelRide,
    getMyRides,
    getSingleRide,
};
