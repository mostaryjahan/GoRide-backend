"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ride = void 0;
const mongoose_1 = require("mongoose");
const ride_interface_1 = require("./ride.interface");
const rideSchema = new mongoose_1.Schema({
    rider: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
    driver: {
        type: mongoose_1.Types.ObjectId,
        ref: "Driver",
        default: null,
    },
    pickupLocation: {
        address: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    destinationLocation: {
        address: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    status: {
        type: String,
        enum: Object.values(ride_interface_1.RideStatus),
        default: ride_interface_1.RideStatus.REQUESTED,
    },
    fare: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    timestamps: {
        requestedAt: { type: Date, default: Date.now },
        acceptedAt: { type: Date },
        pickedUpAt: { type: Date },
        inTransitAt: { type: Date },
        completedAt: { type: Date },
        cancelledAt: { type: Date },
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "card"],
        default: "cash",
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Ride = (0, mongoose_1.model)("Ride", rideSchema);
