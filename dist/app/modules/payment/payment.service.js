"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
exports.PaymentService = void 0;
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const cloudinary_config_1 = require("../../config/cloudinary.config");
const rideInvoice_1 = require("../../utils/rideInvoice");
const sendEmail_1 = require("../../utils/sendEmail");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const ride_model_1 = require("../ride/ride.model");
const mongoose_1 = __importDefault(require("mongoose"));
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = require("./payment.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const initRidePayment = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.Ride.findById(rideId).populate('rider');
    if (!ride) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Ride not found");
    }
    // Check if payment already exists for this ride
    const existingPayment = yield payment_model_1.Payment.findOne({ ride: rideId });
    if (existingPayment) {
        // If payment is already completed, don't allow new payment
        if (existingPayment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Payment already completed for this ride");
        }
        // If payment is pending/failed, reinitialize with same transaction ID
        const sslPayload = {
            address: ride.rider.address || "Dhaka, Bangladesh",
            email: ride.rider.email,
            phoneNumber: ride.rider.phone || "01700000000",
            name: ride.rider.name,
            amount: ride.fare,
            transactionId: existingPayment.transactionId,
        };
        const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
        return sslPayment;
    }
    const rider = ride.rider;
    const transactionId = `RIDE-${Date.now()}-${rideId.slice(-6)}`;
    // Create payment record
    const payment = yield payment_model_1.Payment.create({
        ride: rideId,
        amount: ride.fare,
        transactionId,
        status: payment_interface_1.PAYMENT_STATUS.PENDING,
    });
    const sslPayload = {
        address: rider.address || "Dhaka, Bangladesh",
        email: rider.email,
        phoneNumber: rider.phone || "01700000000",
        name: rider.name,
        amount: ride.fare,
        transactionId: payment.transactionId,
    };
    const sslPayment = yield sslCommerz_service_1.SSLService.sslPaymentInit(sslPayload);
    return sslPayment;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initPayment = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    // This method is for tour booking payments (not implemented for ride system)
    throw new AppError_1.default(http_status_codes_1.default.NOT_IMPLEMENTED, "Tour booking payment not implemented");
});
// success payment
const successPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.PAID,
        }, { runValidators: true, session });
        if (!updatedPayment) {
            throw new AppError_1.default(401, "Payment not found");
        }
        // Check if this is a ride payment
        if (updatedPayment.ride) {
            // Update ride payment status
            const ride = yield ride_model_1.Ride.findByIdAndUpdate(updatedPayment.ride, { isPaid: true }, { runValidators: true, session, new: true }).populate('rider');
            if (ride) {
                // Generate invoice PDF
                const invoiceData = {
                    transactionId: updatedPayment.transactionId,
                    rideDate: ride.createdAt || new Date(),
                    riderName: ride.rider.name,
                    pickupLocation: typeof ride.pickupLocation === 'object' ? ride.pickupLocation.address : ride.pickupLocation,
                    destinationLocation: typeof ride.destinationLocation === 'object' ? ride.destinationLocation.address : ride.destinationLocation,
                    fare: ride.fare,
                };
                try {
                    const pdfBuffer = yield (0, rideInvoice_1.generateRideInvoicePdf)(invoiceData);
                    const cloudinaryResult = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(pdfBuffer, `ride-invoice-${updatedPayment.transactionId}`);
                    if (cloudinaryResult) {
                        // Update payment with invoice URL
                        yield payment_model_1.Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session });
                        // Send email with invoice
                        yield (0, sendEmail_1.sendEmail)({
                            to: ride.rider.email,
                            subject: "Ride Invoice - Payment Confirmation",
                            templateName: "rideInvoice",
                            templateData: invoiceData,
                            attachments: [
                                {
                                    filename: `ride-invoice-${updatedPayment.transactionId}.pdf`,
                                    content: pdfBuffer,
                                    contentType: "application/pdf",
                                },
                            ],
                        });
                    }
                }
                catch (error) {
                    console.log('Invoice generation/email error:', error);
                    // Don't fail the payment if invoice fails
                }
            }
            yield session.commitTransaction();
            session.endSession();
            return { success: true, message: "Ride payment completed successfully" };
        }
        // Original booking payment logic would go here
        // For now, just return success for ride payments
        yield session.commitTransaction();
        session.endSession();
        return { success: true, message: "Payment completed successfully" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// fail payment
const failPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.FAILED,
        }, { runValidators: true, session });
        if (updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.ride) {
            yield ride_model_1.Ride.findByIdAndUpdate(updatedPayment.ride, {
                isPaid: false,
                status: 'CANCELLED',
                'timestamps.cancelledAt': new Date()
            }, { runValidators: true, session });
        }
        yield session.commitTransaction();
        session.endSession();
        return { success: false, message: "Payment failed" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// cancel payment
const cancelPayment = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const updatedPayment = yield payment_model_1.Payment.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: payment_interface_1.PAYMENT_STATUS.CANCELLED,
        }, { runValidators: true, session });
        if (updatedPayment === null || updatedPayment === void 0 ? void 0 : updatedPayment.ride) {
            yield ride_model_1.Ride.findByIdAndUpdate(updatedPayment.ride, {
                isPaid: false,
                status: 'CANCELLED',
                'timestamps.cancelledAt': new Date()
            }, { runValidators: true, session });
        }
        yield session.commitTransaction();
        session.endSession();
        return { success: false, message: "Payment cancelled" };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// download invoice
const getInvoiceDownloadUrl = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findById(paymentId).select("invoiceUrl");
    if (!payment) {
        throw new AppError_1.default(401, "Payment not found");
    }
    if (!payment.invoiceUrl) {
        throw new AppError_1.default(401, "No invoice found");
    }
    return payment.invoiceUrl;
});
exports.PaymentService = {
    initPayment,
    initRidePayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
};
