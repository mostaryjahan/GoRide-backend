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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const redis_1 = require("redis");
const env_1 = require("./env");
exports.redisClient = (0, redis_1.createClient)({
    username: env_1.envVars.REDIS_USERNAME,
    password: env_1.envVars.REDIS_PASSWORD,
    socket: {
        host: env_1.envVars.REDIS_HOST,
        port: Number(env_1.envVars.REDIS_PORT),
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                console.log('Redis max retries reached, giving up');
                return false;
            }
            return Math.min(retries * 50, 500);
        }
    }
});
exports.redisClient.on('error', err => {
    console.log('Redis Client Error', err.message);
});
exports.redisClient.on('connect', () => {
    console.log('Redis connecting...');
});
exports.redisClient.on('ready', () => {
    console.log('Redis ready!');
});
exports.redisClient.on('end', () => {
    console.log('Redis connection ended');
});
// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            yield exports.redisClient.connect();
            console.log("Redis Connected");
        }
    }
    catch (error) {
        console.log('Redis connection failed:', error.message);
        console.log('Continuing without Redis...');
        // Don't throw error, let app continue without Redis
    }
});
exports.connectRedis = connectRedis;
