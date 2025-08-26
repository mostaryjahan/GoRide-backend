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
exports.generateRideInvoicePdf = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const pdfkit_1 = __importDefault(require("pdfkit"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const generateRideInvoicePdf = (invoiceData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
            const buffer = [];
            doc.on("data", (chunk) => buffer.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffer)));
            doc.on("error", (err) => reject(err));
            // Header
            doc.fontSize(24).text("Go-Ride", { align: "center" });
            doc.fontSize(16).text("Ride Invoice", { align: "center" });
            doc.moveDown(2);
            // Invoice Details
            doc.fontSize(12);
            doc.text(`Invoice ID: ${invoiceData.transactionId}`, 50, doc.y);
            doc.text(`Date: ${invoiceData.rideDate.toLocaleDateString()}`, 50, doc.y);
            doc.text(`Rider: ${invoiceData.riderName}`, 50, doc.y);
            doc.moveDown();
            // Ride Details
            doc.fontSize(14).text("Ride Details:", 50, doc.y);
            doc.fontSize(12);
            doc.text(`From: ${invoiceData.pickupLocation}`, 70, doc.y);
            doc.text(`To: ${invoiceData.destinationLocation}`, 70, doc.y);
            doc.moveDown();
            // Payment Details
            doc.fontSize(14).text("Payment Details:", 50, doc.y);
            doc.fontSize(12);
            doc.text(`Fare: ৳${invoiceData.fare}`, 70, doc.y);
            doc.text(`Payment Method: Card`, 70, doc.y);
            doc.text(`Status: Paid`, 70, doc.y);
            doc.moveDown(2);
            // Footer
            doc.fontSize(10).text("Thank you for using Go-Ride!", { align: "center" });
            doc.text("For support, contact us at support@go-ride.com", { align: "center" });
            doc.end();
        });
    }
    catch (error) {
        console.log(error);
        throw new AppError_1.default(401, `Ride invoice PDF creation error: ${error.message}`);
    }
});
exports.generateRideInvoicePdf = generateRideInvoicePdf;
