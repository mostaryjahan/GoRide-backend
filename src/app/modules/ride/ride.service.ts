import { IRide, RideStatus } from "./ride.interface";
import { Ride } from "./ride.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { isValidObjectId } from "mongoose";

const createRide = async (riderId: string, payload: Partial<IRide>) => {
  if (!riderId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  // console.log('Creating ride with payload:', payload);

  const existingRide = await Ride.findOne({
    rider: riderId,
    status: {
      $in: [
        RideStatus.REQUESTED,
        RideStatus.ACCEPTED,
        RideStatus.PICKED_UP,
        RideStatus.IN_TRANSIT,
      ],
    },
  });

  if (existingRide) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You already have an active ride in progress"
    );
  }

  try {
    const ride = await Ride.create({
      rider: riderId,
      pickupLocation: payload.pickupLocation,
      destinationLocation: payload.destinationLocation,
      status: RideStatus.REQUESTED,
      fare: payload.fare,
      isPaid: payload.paymentMethod === 'cash' ? true : false,
      paymentMethod: payload.paymentMethod || 'cash',
      timestamps: {
        requestedAt: new Date(),
      },
    });
    
    // console.log('Ride created successfully:', ride._id);
    return ride;
  } catch (error) {
    // console.error('Error creating ride:', error);
    throw error;
  }

};

const cancelRide = async (rideId: string, riderId: string) => {
  if (!isValidObjectId(rideId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ride ID");
  }

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (ride.rider.toString() !== riderId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to cancel this ride"
    );
  }

  if (
    ride.status !== RideStatus.REQUESTED &&
    ride.status !== RideStatus.ACCEPTED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel a ride at '${ride.status}' stage`
    );
  }

  // Check if within 5-minute cancel window
  const requestTime = ride.timestamps.requestedAt || ride.createdAt;
  const now = new Date();
  const timeDiff = (now.getTime() - requestTime.getTime()) / (1000 * 60); // minutes
  
  if (timeDiff > 5) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cancel window expired. You can only cancel within 5 minutes of requesting"
    );
  }

  ride.status = RideStatus.CANCELLED;
  ride.timestamps.cancelledAt = new Date();

  await ride.save();

  return ride;
};

const getMyRides = async (riderId: string) => {
  const rides = await Ride.find({ rider: riderId }).sort({ createdAt: -1 });

  return rides;
};

const getSingleRide = async (rideId: string, riderId: string) => {
  if (!isValidObjectId(rideId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid ride ID");
  }

  const ride = await Ride.findById(rideId)
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
    throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
  }

  if (ride.rider._id.toString() !== riderId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this ride"
    );
  }

  return ride;
};

export const RideService = {
  createRide,
  cancelRide,
  getMyRides,
  getSingleRide,
};