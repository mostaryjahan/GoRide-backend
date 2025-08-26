"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const driver_route_1 = require("../modules/driver/driver.route");
const admin_route_1 = require("../modules/admin/admin.route");
const ride_route_1 = require("../modules/ride/ride.route");
const location_route_1 = require("../modules/location/location.route");
const payment_route_1 = require("../modules/payment/payment.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_route_1.UserRoutes,
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes,
    },
    {
        path: "/driver",
        route: driver_route_1.DriverRoutes,
    },
    {
        path: "/admin",
        route: admin_route_1.AdminRoutes
    },
    {
        path: "/rides",
        route: ride_route_1.RideRoutes
    },
    {
        path: "/location",
        route: location_route_1.LocationRoutes
    },
    {
        path: "/payment",
        route: payment_route_1.PaymentRoutes
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
