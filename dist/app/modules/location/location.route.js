"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationRoutes = void 0;
const express_1 = require("express");
const location_controller_1 = require("./location.controller");
const router = (0, express_1.Router)();
router.get('/search', location_controller_1.LocationController.searchLocation);
exports.LocationRoutes = router;
