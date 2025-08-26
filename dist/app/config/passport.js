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
/* eslint-disable @typescript-eslint/no-explicit-any */
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../modules/user/user.model");
const user_interface_1 = require("../modules/user/user.interface");
const env_1 = require("./env");
const passport_google_oauth20_1 = require("passport-google-oauth20");
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    passwordField: "password",
}, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isUserExist = yield user_model_1.User.findOne({ email });
        if (!isUserExist) {
            return done(null, false, { message: "User does not exist" });
        }
        // if (!isUserExist.isVerified) {
        //   return done(null, false, { message: "User is not verified" });
        // }
        if (isUserExist.isBlock === user_interface_1.IsBlock.BLOCK) {
            return done(null, false, { message: "User is blocked" });
        }
        if (isUserExist.isDeleted) {
            return done(null, false, { message: "User is deleted" });
        }
        const isPasswordMatched = yield bcryptjs_1.default.compare(password, isUserExist.password);
        if (!isPasswordMatched) {
            return done(null, false, { message: "Password does not match" });
        }
        return done(null, isUserExist);
    }
    catch (error) {
        console.log(error);
        done(error);
    }
})));
// for google login
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.envVars.GOOGLE_CLIENT_ID,
    clientSecret: env_1.envVars.GOOGLE_CLIENT_SECRET,
    callbackURL: env_1.envVars.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const email = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value;
        if (!email) {
            return done(null, false, { message: "No email found" });
        }
        let isUserExist = yield user_model_1.User.findOne({ email });
        if (isUserExist && !isUserExist.isVerified) {
            return done(null, false, { message: "User is not Verified" });
        }
        if (isUserExist &&
            (isUserExist.isBlock === user_interface_1.IsBlock.BLOCK)) {
            done(`User is Blocked`);
        }
        if (isUserExist && isUserExist.isDeleted) {
            return done(null, false, { message: "User is deleted" });
        }
        if (!isUserExist) {
            isUserExist = yield user_model_1.User.create({
                email,
                name: profile.displayName,
                picture: (_b = profile.photos) === null || _b === void 0 ? void 0 : _b[0].value,
                role: user_interface_1.Role.RIDER,
                isVerified: true,
                auths: [
                    {
                        provider: "google",
                        providerId: profile.id,
                    },
                ],
            });
        }
        return done(null, isUserExist);
    }
    catch (error) {
        // console.log("Google Strategy Error", error);
        return done(error);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        console.log(error);
        done(error);
    }
}));
