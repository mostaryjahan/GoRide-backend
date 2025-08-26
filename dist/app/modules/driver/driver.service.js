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
exports.DriverService = void 0;
const driver_model_1 = require("./driver.model");
const driver_interface_1 = require("./driver.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const ride_model_1 = require("../ride/ride.model");
const ride_interface_1 = require("../ride/ride.interface");
const user_model_1 = require("../user/user.model");
const applyToBeDriver = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isAlreadyDriver = yield driver_model_1.Driver.findOne({ user: userId });
    if (isAlreadyDriver) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You have already applied or are already a driver.");
    }
    const newDriver = yield driver_model_1.Driver.create({
        user: userId,
        vehicleType: payload.vehicleType,
        vehicleNumber: payload.vehicleNumber,
        approvalStatus: driver_interface_1.IsApprove.PENDING,
        availabilityStatus: driver_interface_1.IsAvailable.ONLINE,
    });
    return newDriver;
});
const getAvailableRides = () => __awaiter(void 0, void 0, void 0, function* () {
    const availableRides = yield ride_model_1.Ride.find({
        status: ride_interface_1.RideStatus.REQUESTED,
    }).sort({ createdAt: -1 });
    return availableRides;
});
const acceptRide = (rideId, driverUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: driverUserId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Driver profile not found");
    }
    if (driver.approvalStatus === driver_interface_1.IsApprove.SUSPENDED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are a SUSPENDED Driver. You cann't accept Request");
    }
    const ride = yield ride_model_1.Ride.findById(rideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (ride.status !== ride_interface_1.RideStatus.REQUESTED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Ride is not available for acceptance");
    }
    ride.driver = driver._id;
    ride.status = ride_interface_1.RideStatus.ACCEPTED;
    ride.timestamps.acceptedAt = new Date();
    yield ride.save();
    console.log('Ride accepted - stored driver ID:', driver._id.toString());
    driver.availabilityStatus = driver_interface_1.IsAvailable.OFFLINE;
    yield driver.save();
    return ride;
});
const rejectRide = (rideId, driverUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: driverUserId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Driver profile not found");
    }
    const ride = yield ride_model_1.Ride.findById(rideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    if (ride.status === ride_interface_1.RideStatus.REJECTED ||
        ride.status === ride_interface_1.RideStatus.COMPLETED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Ride cannot be rejected`);
    }
    // Set driver association for history tracking
    ride.driver = driver._id;
    ride.status = ride_interface_1.RideStatus.REJECTED;
    yield ride.save();
    console.log('Ride rejected - stored driver ID:', driver._id.toString());
    driver.availabilityStatus = driver_interface_1.IsAvailable.ONLINE;
    yield driver.save();
    return ride;
});
const updateRideStatus = (rideId, driverUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: driverUserId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver profile not found");
    }
    const ride = yield ride_model_1.Ride.findById(rideId);
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    // Check if driver is assigned (handle both driver._id and userId)
    const isAssigned = ride.driver && (ride.driver.toString() === driver._id.toString() ||
        ride.driver.toString() === driverUserId);
    if (!isAssigned) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not assigned to this ride");
    }
    let newStatus;
    if (ride.status === ride_interface_1.RideStatus.ACCEPTED) {
        newStatus = ride_interface_1.RideStatus.PICKED_UP;
        ride.timestamps.pickedUpAt = new Date();
    }
    else if (ride.status === ride_interface_1.RideStatus.PICKED_UP) {
        newStatus = ride_interface_1.RideStatus.IN_TRANSIT;
        ride.timestamps.inTransitAt = new Date();
    }
    else if (ride.status === ride_interface_1.RideStatus.IN_TRANSIT) {
        newStatus = ride_interface_1.RideStatus.COMPLETED;
        ride.timestamps.completedAt = new Date();
        driver.earnings = (driver.earnings || 0) + ride.fare;
        ride.isPaid = true;
    }
    else {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Invalid ride status transition from ${ride.status}`);
    }
    ride.status = newStatus;
    yield ride.save();
    if (newStatus === ride_interface_1.RideStatus.COMPLETED) {
        driver.availabilityStatus = driver_interface_1.IsAvailable.ONLINE;
        yield driver.save();
    }
    return ride;
});
const getRideHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver not found");
    }
    const rides = yield ride_model_1.Ride.find({ driver: driver._id })
        .populate('rider', 'name email phone')
        .sort({ createdAt: -1 });
    const completedRides = rides.filter(ride => ride.status === 'COMPLETED');
    const totalEarnings = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const averageRating = completedRides.length > 0
        ? (completedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / completedRides.length).toFixed(1)
        : 0;
    return {
        totalRides: rides.length,
        completedRides: completedRides.length,
        totalEarnings,
        averageRating,
        rides,
    };
});
const updateDriverStatus = (userId, isOnline) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role !== 'DRIVER') {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Only drivers can update online status");
    }
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, { isOnline }, { new: true, runValidators: true }).select('-password');
    return updatedUser;
});
const getDriverStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Get today's completed rides
    const todayRides = yield ride_model_1.Ride.find({
        driver: userId,
        status: 'COMPLETED',
        createdAt: { $gte: today, $lt: tomorrow }
    });
    // Get all completed rides for average rating and recent rides
    const [allCompletedRides, recentRides] = yield Promise.all([
        ride_model_1.Ride.find({
            driver: userId,
            status: 'COMPLETED'
        }),
        ride_model_1.Ride.find({
            driver: userId
        }).sort({ createdAt: -1 }).limit(5).populate('rider', 'name')
    ]);
    const todayEarnings = todayRides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalRides = allCompletedRides.length;
    const averageRating = totalRides > 0
        ? (allCompletedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / totalRides).toFixed(1)
        : 0;
    return {
        todayEarnings,
        todayRides: todayRides.length,
        totalRides,
        averageRating,
        hoursOnline: 0,
        earningsChange: '+0%',
        recentRides
    };
});
const getDriverEarnings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver || !driver.isVerified) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver is not Verified");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    // Get rides for different periods
    const [todayRides, weeklyRides, monthlyRides, allRides] = yield Promise.all([
        ride_model_1.Ride.find({
            driver: driver._id,
            status: 'COMPLETED',
            createdAt: { $gte: today, $lt: tomorrow }
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: 'COMPLETED',
            createdAt: { $gte: weekStart }
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: 'COMPLETED',
            createdAt: { $gte: monthStart }
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: 'COMPLETED'
        }).sort({ createdAt: -1 }).limit(10)
    ]);
    return {
        todayEarnings: todayRides.reduce((sum, ride) => sum + ride.fare, 0),
        todayRides: todayRides.length,
        weeklyEarnings: weeklyRides.reduce((sum, ride) => sum + ride.fare, 0),
        weeklyRides: weeklyRides.length,
        monthlyEarnings: monthlyRides.reduce((sum, ride) => sum + ride.fare, 0),
        monthlyRides: monthlyRides.length,
        totalEarnings: allRides.reduce((sum, ride) => sum + ride.fare, 0),
        recentEarnings: allRides
    };
});
const getActiveRides = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('getActiveRides called with userId:', userId);
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver not found");
    }
    console.log('Driver found - ID:', driver._id, 'User:', driver.user);
    const activeRides = yield ride_model_1.Ride.find({
        $or: [
            { driver: driver._id },
            { driver: userId }
        ],
        status: { $in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] }
    }).populate('rider', 'name email phone').sort({ createdAt: -1 });
    console.log('Active rides found:', activeRides.length);
    console.log('Query: driver =', driver._id.toString(), 'status in', ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']);
    return activeRides;
});
exports.DriverService = {
    applyToBeDriver,
    getAvailableRides,
    acceptRide,
    rejectRide,
    updateRideStatus,
    getRideHistory,
    updateDriverStatus,
    getDriverStats,
    getDriverEarnings,
    getActiveRides,
};
