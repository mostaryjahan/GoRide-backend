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
const user_interface_1 = require("../user/user.interface");
const applyToBeDriver = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isAlreadyDriver = yield driver_model_1.Driver.findOne({ user: userId });
    if (isAlreadyDriver) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You have already applied or are already a driver.");
    }
    yield user_model_1.User.findByIdAndUpdate(userId, { role: user_interface_1.Role.DRIVER });
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
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You are a SUSPENDED Driver. You can't accept Request");
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
    const isAssigned = ride.driver &&
        (ride.driver.toString() === driver._id.toString() ||
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
        .populate("rider", "name email phone")
        .sort({ createdAt: -1 });
    const completedRides = rides.filter((ride) => ride.status === "COMPLETED");
    const totalEarnings = completedRides.reduce((sum, ride) => sum + ride.fare, 0);
    const averageRating = completedRides.length > 0
        ? (completedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) /
            completedRides.length).toFixed(1)
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
    const driver = yield driver_model_1.Driver.findById({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver profile not found");
    }
    if (driver.approvalStatus !== driver_interface_1.IsApprove.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Only approved drivers can update their status");
    }
    yield user_model_1.User.findByIdAndUpdate(userId, { isOnline });
    driver.availabilityStatus = isOnline ? driver_interface_1.IsAvailable.ONLINE : driver_interface_1.IsAvailable.OFFLINE;
    yield driver.save();
    return { isOnline, availabilityStatus: driver.availabilityStatus };
});
const getActiveRides = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver not found");
    }
    const activeRides = yield ride_model_1.Ride.find({
        $or: [{ driver: driver._id }, { driver: userId }],
        status: { $in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"] },
    })
        .populate("rider", "name email phone")
        .sort({ createdAt: -1 });
    return activeRides;
});
// driver.service.ts
const getDriverProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId }).populate('user', '-password');
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver profile not found");
    }
    return driver;
});
// Fix the getDriverStats function
const getDriverStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Driver not found");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Get today's completed rides for this driver
    const todayRides = yield ride_model_1.Ride.find({
        driver: driver._id, // Filter by driver ID
        status: "COMPLETED",
        createdAt: { $gte: today, $lt: tomorrow },
    });
    // Get all completed rides for this driver
    const [allCompletedRides, recentRides] = yield Promise.all([
        ride_model_1.Ride.find({
            driver: driver._id, // Filter by driver ID
            status: "COMPLETED",
        }),
        ride_model_1.Ride.find({
            driver: driver._id, // Filter by driver ID
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("rider", "name"),
    ]);
    const todayEarnings = todayRides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalRides = allCompletedRides.length;
    const averageRating = totalRides > 0
        ? (allCompletedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) /
            totalRides).toFixed(1)
        : 0;
    return {
        todayEarnings,
        todayRides: todayRides.length,
        totalRides,
        averageRating,
        hoursOnline: 0,
        earningsChange: "+0%",
        recentRides,
    };
});
// Fix the getDriverEarnings function
const getDriverEarnings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.Driver.findOne({ user: userId });
    if (!driver) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Driver not found");
    }
    // Get current date in UTC and adjust for timezone
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    // Today's date range (local time)
    const todayStart = new Date(now.getTime() - timezoneOffset);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    // Weekly date range (start of week)
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Sunday of this week
    // Monthly date range (start of month)
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    console.log('Date ranges:', {
        today: { start: todayStart, end: todayEnd },
        week: { start: weekStart },
        month: { start: monthStart }
    });
    // Get rides for different periods for this specific driver
    const [todayRides, weeklyRides, monthlyRides, allRides] = yield Promise.all([
        ride_model_1.Ride.find({
            driver: driver._id,
            status: "COMPLETED",
            createdAt: {
                $gte: todayStart,
                $lt: todayEnd
            },
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: "COMPLETED",
            createdAt: { $gte: weekStart },
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: "COMPLETED",
            createdAt: { $gte: monthStart },
        }),
        ride_model_1.Ride.find({
            driver: driver._id,
            status: "COMPLETED",
        })
            .sort({ createdAt: -1 })
            .limit(10),
    ]);
    console.log('Today rides count:', todayRides.length);
    console.log('Today rides:', todayRides.map(r => ({
        fare: r.fare,
        createdAt: r.createdAt
    })));
    return {
        todayEarnings: todayRides.reduce((sum, ride) => sum + ride.fare, 0),
        todayRides: todayRides.length,
        weeklyEarnings: weeklyRides.reduce((sum, ride) => sum + ride.fare, 0),
        weeklyRides: weeklyRides.length,
        monthlyEarnings: monthlyRides.reduce((sum, ride) => sum + ride.fare, 0),
        monthlyRides: monthlyRides.length,
        totalEarnings: allRides.reduce((sum, ride) => sum + ride.fare, 0),
        recentEarnings: allRides,
    };
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
    getDriverProfile
};
