"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRideZodSchema = void 0;
const zod_1 = require("zod");
exports.createRideZodSchema = zod_1.z.object({
    pickupLocation: zod_1.z.object({
        address: zod_1.z.string({ message: "Pickup address is required" }),
        coordinates: zod_1.z.object({
            lat: zod_1.z.number({ message: "Pickup latitude is required" }),
            lng: zod_1.z.number({ message: "Pickup longitude is required" }),
        }),
    }),
    destinationLocation: zod_1.z.object({
        address: zod_1.z.string({ message: "Destination address is required" }),
        coordinates: zod_1.z.object({
            lat: zod_1.z.number({ message: "Destination latitude is required" }),
            lng: zod_1.z.number({ message: "Destination longitude is required" }),
        }),
    }),
    fare: zod_1.z.number({
        message: "Fare is Required"
    })
        .positive("Fare must be a positive number")
        .min(10, "Fare must be at least 10 taka"),
    paymentMethod: zod_1.z.enum(["cash", "card"]).optional().default("cash")
});
