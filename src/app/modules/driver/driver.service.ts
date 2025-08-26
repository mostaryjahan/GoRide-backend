import { Driver } from "./driver.model";
import { IDriver, IsApprove, IsAvailable } from "./driver.interface";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { Ride } from "../ride/ride.model";
import { RideStatus } from "../ride/ride.interface";
import { User } from "../user/user.model";

const applyToBeDriver = async (userId: string, payload: Partial<IDriver>) => {
  const isAlreadyDriver = await Driver.findOne({ user: userId });

  if (isAlreadyDriver) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already applied or are already a driver."
    );
  }

  const newDriver = await Driver.create({
    user: userId,
    vehicleType: payload.vehicleType,
    vehicleNumber: payload.vehicleNumber,
    approvalStatus: IsApprove.PENDING,
    availabilityStatus: IsAvailable.ONLINE,
  });

  return newDriver;
};

const getAvailableRides = async () => {
  const availableRides = await Ride.find({
    status: RideStatus.REQUESTED,
  }).sort({ createdAt: -1 });

  return availableRides;
};

const acceptRide = async (rideId: string, driverUserId: string) => {
  const driver = await Driver.findOne({ user: driverUserId });

  if (!driver) {
    throw new AppError(httpStatus.FORBIDDEN, "Driver profile not found");
  }

  if(driver.approvalStatus === IsApprove.SUSPENDED) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are a SUSPENDED Driver. You cann't accept Request");
  }

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (ride.status !== RideStatus.REQUESTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Ride is not available for acceptance"
    );
  }

  ride.driver = driver._id;
  ride.status = RideStatus.ACCEPTED;
  ride.timestamps.acceptedAt = new Date();
  await ride.save();
  
  console.log('Ride accepted - stored driver ID:', driver._id.toString());

  driver.availabilityStatus = IsAvailable.OFFLINE;
  await driver.save();

  return ride;
};

const rejectRide = async (rideId: string, driverUserId: string) => {
  const driver = await Driver.findOne({ user: driverUserId });

  if (!driver) {
    throw new AppError(httpStatus.FORBIDDEN, "Driver profile not found");
  }

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (
    ride.status === RideStatus.REJECTED ||
    ride.status === RideStatus.COMPLETED
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, `Ride cannot be rejected`);
  }

  // Set driver association for history tracking
  ride.driver = driver._id;
  ride.status = RideStatus.REJECTED;
  await ride.save();
  
  console.log('Ride rejected - stored driver ID:', driver._id.toString());

  driver.availabilityStatus = IsAvailable.ONLINE;
  await driver.save();

  return ride;
};

const updateRideStatus = async (rideId: string, driverUserId: string) => {
  const driver = await Driver.findOne({ user: driverUserId });
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  // Check if driver is assigned (handle both driver._id and userId)
  const isAssigned = ride.driver && (
    ride.driver.toString() === driver._id.toString() || 
    ride.driver.toString() === driverUserId
  );
  
  if (!isAssigned) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not assigned to this ride"
    );
  }

  let newStatus: typeof ride.status;

  if (ride.status === RideStatus.ACCEPTED) {
    newStatus = RideStatus.PICKED_UP;
    ride.timestamps.pickedUpAt = new Date();
  } else if (ride.status === RideStatus.PICKED_UP) {
    newStatus = RideStatus.IN_TRANSIT;
    ride.timestamps.inTransitAt = new Date();
  } else if (ride.status === RideStatus.IN_TRANSIT) {
    newStatus = RideStatus.COMPLETED;
    ride.timestamps.completedAt = new Date();
    driver.earnings = (driver.earnings || 0) + ride.fare;
    ride.isPaid = true;
  } else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid ride status transition from ${ride.status}`
    );
  }

  ride.status = newStatus;
  await ride.save();

  if (newStatus === RideStatus.COMPLETED) {
    driver.availabilityStatus = IsAvailable.ONLINE;
    await driver.save();
  }

  return ride;
};


const getRideHistory = async (userId: string) => {
  const driver = await Driver.findOne({ user: userId });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const rides = await Ride.find({ driver: driver._id })
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
};


const updateDriverStatus = async (userId: string, isOnline: boolean) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== 'DRIVER') {
    throw new AppError(httpStatus.FORBIDDEN, "Only drivers can update online status");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isOnline },
    { new: true, runValidators: true }
  ).select('-password');

  return updatedUser;
};

const getDriverStats = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's completed rides
  const todayRides = await Ride.find({
    driver: userId,
    status: 'COMPLETED',
    createdAt: { $gte: today, $lt: tomorrow }
  });

  // Get all completed rides for average rating and recent rides
  const [allCompletedRides, recentRides] = await Promise.all([
    Ride.find({
      driver: userId,
      status: 'COMPLETED'
    }),
    Ride.find({
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
};

const getDriverEarnings = async (userId: string) => {
  const driver = await Driver.findOne({ user: userId });
    if (!driver || !driver.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "Driver is not Verified");
      }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get rides for different periods
  const [todayRides, weeklyRides, monthlyRides, allRides] = await Promise.all([
    Ride.find({
      driver: driver._id,
      status: 'COMPLETED',
      createdAt: { $gte: today, $lt: tomorrow }
    }),
    Ride.find({
      driver: driver._id,
      status: 'COMPLETED',
      createdAt: { $gte: weekStart }
    }),
    Ride.find({
      driver: driver._id,
      status: 'COMPLETED',
      createdAt: { $gte: monthStart }
    }),
    Ride.find({
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
};

const getActiveRides = async (userId: string) => {
  console.log('getActiveRides called with userId:', userId);
  
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }
  
  console.log('Driver found - ID:', driver._id, 'User:', driver.user);

  const activeRides = await Ride.find({
    $or: [
      { driver: driver._id },
      { driver: userId }
    ],
    status: { $in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] }
  }).populate('rider', 'name email phone').sort({ createdAt: -1 });
  
  console.log('Active rides found:', activeRides.length);
  console.log('Query: driver =', driver._id.toString(), 'status in', ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']);

  return activeRides;
};

export const DriverService = {
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