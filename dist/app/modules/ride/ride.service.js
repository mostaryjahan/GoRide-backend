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
exports.RideService = void 0;
const ride_interface_1 = require("./ride.interface");
const ride_model_1 = require("./ride.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const mongoose_1 = require("mongoose");
const createRide = (riderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!riderId) {
        throw new AppError_1.default(http_status_codes_1.default.UNAUTHORIZED, "Unauthorized access");
    }
    // console.log('Creating ride with payload:', payload);
    const existingRide = yield ride_model_1.Ride.findOne({
        rider: riderId,
        status: {
            $in: [
                ride_interface_1.RideStatus.REQUESTED,
                ride_interface_1.RideStatus.ACCEPTED,
                ride_interface_1.RideStatus.PICKED_UP,
                ride_interface_1.RideStatus.IN_TRANSIT,
            ],
        },
    });
    if (existingRide) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You already have an active ride in progress");
    }
    try {
        const ride = yield ride_model_1.Ride.create({
            rider: riderId,
            pickupLocation: payload.pickupLocation,
            destinationLocation: payload.destinationLocation,
            status: ride_interface_1.RideStatus.REQUESTED,
            fare: payload.fare,
            isPaid: payload.paymentMethod === 'cash' ? true : false,
            paymentMethod: payload.paymentMethod || 'cash',
            timestamps: {
                requestedAt: new Date(),
            },
        });
        // console.log('Ride created successfully:', ride._id);
        return ride;
    }
    catch (error) {
        // console.error('Error creating ride:', error);
        throw error;
    }
});
const cancelRide = (rideId, riderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(rideId)) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid ride ID");
    }
    const ride = yield ride_model_1.Ride.findById(rideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (ride.rider.toString() !== riderId) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized to cancel this ride");
    }
    if (ride.status !== ride_interface_1.RideStatus.REQUESTED &&
        ride.status !== ride_interface_1.RideStatus.ACCEPTED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Cannot cancel a ride at '${ride.status}' stage`);
    }
    // Check if within 5-minute cancel window
    const requestTime = ride.timestamps.requestedAt || ride.createdAt;
    const now = new Date();
    const timeDiff = (now.getTime() - requestTime.getTime()) / (1000 * 60); // minutes
    if (timeDiff > 5) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cancel window expired. You can only cancel within 5 minutes of requesting");
    }
    ride.status = ride_interface_1.RideStatus.CANCELLED;
    ride.timestamps.cancelledAt = new Date();
    yield ride.save();
    return ride;
});
const getMyRides = (riderId) => __awaiter(void 0, void 0, void 0, function* () {
    const rides = yield ride_model_1.Ride.find({ rider: riderId }).sort({ createdAt: -1 });
    return rides;
});
const getSingleRide = (rideId, riderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, mongoose_1.isValidObjectId)(rideId)) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Invalid ride ID");
    }
    const ride = yield ride_model_1.Ride.findById(rideId)
        .populate({
        path: 'driver',
        select: 'vehicleType vehicleNumber',
        populate: {
            path: 'user',
            select: 'name phone'
        }
    })
        .populate('rider', 'name phone');
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (ride.rider._id.toString() !== riderId) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized to view this ride");
    }
    return ride;
});
exports.RideService = {
    createRide,
    cancelRide,
    getMyRides,
    getSingleRide,
};
