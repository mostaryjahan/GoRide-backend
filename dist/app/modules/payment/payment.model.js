"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const payment_interface_1 = require("./payment.interface");
const paymentSchema = new mongoose_1.Schema({
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: false,
        index: true, // Regular index, not unique
    },
    ride: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Ride",
        required: false,
        index: true, // Regular index, not unique
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PAYMENT_STATUS),
        default: payment_interface_1.PAYMENT_STATUS.UNPAID,
    },
    amount: {
        type: Number,
        required: true
    },
    paymentGatewayData: {
        type: mongoose_1.Schema.Types.Mixed
    },
    invoiceUrl: {
        type: String,
    },
}, {
    timestamps: true
});
paymentSchema.index({ booking: 1, ride: 1 });
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
