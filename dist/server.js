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
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./app/config/env");
const seedAdmin_1 = require("./app/utils/seedAdmin");
const redis_config_1 = require("./app/config/redis.config");
let server;
let io;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.envVars.DB_URL);
        console.log("connected to DB ✅");
        server = app_1.default.listen(5000, () => {
            console.log(`Server is listening to port ${env_1.envVars.PORT} `);
        });
        // Initialize Socket.IO
        io = new socket_io_1.Server(server, {
            cors: {
                origin: env_1.envVars.FRONTEND_URL,
                methods: ["GET", "POST"]
            }
        });
        // Socket.IO connection handling
        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);
            // Join ride room
            socket.on('join-ride', (rideId) => {
                socket.join(`ride-${rideId}`);
                console.log(`User ${socket.id} joined ride ${rideId}`);
            });
            // Leave ride room
            socket.on('leave-ride', (rideId) => {
                socket.leave(`ride-${rideId}`);
                console.log(`User ${socket.id} left ride ${rideId}`);
            });
            // Handle driver location updates
            socket.on('driver-location-update', (data) => {
                const { rideId, location } = data;
                socket.to(`ride-${rideId}`).emit('driver-location-changed', location);
            });
            // Handle ride status updates
            socket.on('ride-status-update', (data) => {
                const { rideId, status, driverInfo } = data;
                io.to(`ride-${rideId}`).emit('ride-status-changed', { status, driverInfo });
            });
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
        // Make io available globally
        global.io = io;
    }
    catch (error) {
        console.log(error);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, redis_config_1.connectRedis)();
    yield startServer();
    yield (0, seedAdmin_1.seedAdmin)();
}))();
process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection detected...... Server shutting down..", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("unCaughtException", (err) => {
    console.log("uncaught Exception detected...... Server shutting down..", err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received...... Server shutting down..");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
