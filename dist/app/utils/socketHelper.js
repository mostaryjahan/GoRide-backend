"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = exports.emitToRide = void 0;
const emitToRide = (rideId, event, data) => {
    if (global.io) {
        global.io.to(`ride-${rideId}`).emit(event, data);
    }
};
exports.emitToRide = emitToRide;
const emitToUser = (userId, event, data) => {
    if (global.io) {
        global.io.to(`user-${userId}`).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
