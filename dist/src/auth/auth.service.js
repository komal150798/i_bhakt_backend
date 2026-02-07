"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const customer_entity_1 = require("../users/entities/customer.entity");
const admin_user_entity_1 = require("../users/entities/admin-user.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const customer_token_entity_1 = require("./entities/customer-token.entity");
const admin_token_entity_1 = require("./entities/admin-token.entity");
const otp_service_1 = require("./services/otp.service");
const jwt_service_1 = require("./services/jwt.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const horoscope_service_1 = require("../horoscope/services/horoscope.service");
const string_util_1 = require("../common/utils/string.util");
let AuthService = class AuthService {
    constructor(customerRepository, adminUserRepository, refreshTokenRepository, customerTokenRepository, adminTokenRepository, otpService, jwtService, configService, horoscopeService) {
        this.customerRepository = customerRepository;
        this.adminUserRepository = adminUserRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.customerTokenRepository = customerTokenRepository;
        this.adminTokenRepository = adminTokenRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.horoscopeService = horoscopeService;
    }
    getAppSessionExpiration() {
        const days = this.configService.get('APP_SESSION_DAYS', 90);
        return `${days}d`;
    }
    async sendOtp(phoneNumber) {
        const normalizedPhone = (0, string_util_1.normalizePhoneNumber)(phoneNumber);
        const otpResult = await this.otpService.issueOtp(normalizedPhone, 'login');
        const response = {
            message: 'OTP sent successfully',
        };
        if (process.env.APP_ENV !== 'production') {
            response.debug_code = otpResult.otp_code;
        }
        return response;
    }
    async sendEmailOtp(email) {
        const otpResult = await this.otpService.issueOtp(email, 'verify_email');
        const response = {
            message: 'OTP sent successfully to email',
        };
        if (process.env.APP_ENV !== 'production') {
            response.debug_code = otpResult.otp_code;
        }
        return response;
    }
    async verifyOtp(phoneNumber, otpCode, isLogin = false) {
        const normalizedPhone = (0, string_util_1.normalizePhoneNumber)(phoneNumber);
        if (!(await this.otpService.verifyOtp(normalizedPhone, otpCode))) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        const customer = await this.findCustomerByPhone(phoneNumber);
        if (isLogin && !customer) {
            throw new common_1.NotFoundException('User not found. Please register first or check your phone number.');
        }
        const appSessionExpiration = this.getAppSessionExpiration();
        let userId = null;
        const role = user_role_enum_1.UserRole.USER;
        if (customer) {
            userId = customer.id;
            customer.last_login = new Date();
            await this.customerRepository.save(customer);
        }
        const payload = {
            sub: userId || 0,
            phone_number: customer?.phone_number || normalizedPhone,
            role: role,
            type: 'user',
        };
        const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
        const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);
        if (customer) {
            await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'otp');
        }
        return {
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: userId || undefined,
        };
    }
    async verifyEmailOtp(email, otpCode, isLogin = false) {
        if (!(await this.otpService.verifyOtp(email, otpCode))) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        const customer = await this.findCustomerByEmail(email);
        if (isLogin && !customer) {
            throw new common_1.NotFoundException('User not found. Please register first or check your email.');
        }
        const appSessionExpiration = this.getAppSessionExpiration();
        let userId = null;
        const role = user_role_enum_1.UserRole.USER;
        if (customer) {
            userId = customer.id;
            customer.last_login = new Date();
            await this.customerRepository.save(customer);
        }
        const payload = {
            sub: userId || 0,
            email: email,
            role: role,
            type: 'user',
        };
        const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
        const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);
        if (customer) {
            await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'otp');
        }
        return {
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: userId || undefined,
        };
    }
    async checkUserExists(phoneNumber, email) {
        if (phoneNumber) {
            const customer = await this.findCustomerByPhone(phoneNumber);
            if (customer)
                return true;
        }
        if (email) {
            const customer = await this.findCustomerByEmail(email);
            if (customer)
                return true;
        }
        return false;
    }
    async resetPasswordWithOtp(phoneNumber, email, otpCode, newPassword) {
        if (!phoneNumber && !email) {
            throw new common_1.BadRequestException('Either phone_number or email is required');
        }
        const otpIdentifier = phoneNumber ? (0, string_util_1.normalizePhoneNumber)(phoneNumber) : email;
        if (!(await this.otpService.verifyOtp(otpIdentifier, otpCode))) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        let customer = null;
        if (phoneNumber) {
            customer = await this.findCustomerByPhone(phoneNumber);
        }
        else if (email) {
            customer = await this.findCustomerByEmail(email);
        }
        if (!customer) {
            throw new common_1.NotFoundException('User not found. Please check your phone number or email.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        customer.password = hashedPassword;
        await this.customerRepository.save(customer);
        return {
            success: true,
            message: 'Password reset successfully',
        };
    }
    async logout(refreshTokenString) {
        const customerToken = await this.customerTokenRepository.findOne({
            where: { token: refreshTokenString, is_revoked: false },
        });
        if (customerToken) {
            customerToken.is_revoked = true;
            await this.customerTokenRepository.save(customerToken);
            return;
        }
        const adminToken = await this.adminTokenRepository.findOne({
            where: { token: refreshTokenString, is_revoked: false },
        });
        if (adminToken) {
            adminToken.is_revoked = true;
            await this.adminTokenRepository.save(adminToken);
            return;
        }
        const legacyToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenString },
        });
        if (legacyToken) {
            legacyToken.is_revoked = true;
            await this.refreshTokenRepository.save(legacyToken);
        }
    }
    async logoutByUserId(userId, userType = 'user') {
        if (userType === 'admin') {
            await this.adminTokenRepository.update({ added_by: userId, is_revoked: false }, { is_revoked: true });
        }
        else {
            await this.customerTokenRepository.update({ customer_id: userId, is_revoked: false }, { is_revoked: true });
        }
    }
    async storeRefreshToken(token, userId, adminId, expiresIn) {
        const payload = this.jwtService.verifyToken(token);
        if (!payload)
            return;
        let expiresAt;
        if (expiresIn) {
            const expiresInMs = this.parseExpiresIn(expiresIn);
            expiresAt = new Date(Date.now() + expiresInMs);
        }
        else {
            expiresAt = new Date(payload.exp * 1000);
        }
        const refreshToken = this.refreshTokenRepository.create({
            token,
            user_id: userId,
            admin_id: adminId,
            expires_at: expiresAt,
            is_revoked: false,
        });
        await this.refreshTokenRepository.save(refreshToken);
    }
    parseExpiresIn(expiresIn) {
        const match = expiresIn.match(/^(\d+)([dhms])$/);
        if (!match) {
            return 90 * 24 * 60 * 60 * 1000;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'm':
                return value * 60 * 1000;
            case 's':
                return value * 1000;
            default:
                return 90 * 24 * 60 * 60 * 1000;
        }
    }
    async validateCustomerByPassword(username, password) {
        const normalizedUsername = username.startsWith('+') || /^\d+$/.test(username)
            ? (0, string_util_1.normalizePhoneNumber)(username)
            : username;
        const customer = await this.customerRepository.findOne({
            where: [
                { email: username, is_deleted: false },
                { phone_number: normalizedUsername, is_deleted: false },
                { phone_number: username, is_deleted: false },
            ],
        });
        if (!customer || !customer.password) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
            return null;
        }
        return customer;
    }
    async loginWithPassword(username, password) {
        const customer = await this.validateCustomerByPassword(username, password);
        if (!customer) {
            throw new common_1.UnauthorizedException('Invalid username or password');
        }
        customer.last_login = new Date();
        await this.customerRepository.save(customer);
        return this.issueCustomerTokens(customer);
    }
    async verifyOtpForLogin(phoneNumber, otpCode) {
        const normalizedPhone = (0, string_util_1.normalizePhoneNumber)(phoneNumber);
        if (!(await this.otpService.verifyOtp(normalizedPhone, otpCode))) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        let customer = await this.findCustomerByPhone(phoneNumber);
        if (!customer) {
            customer = this.customerRepository.create({
                phone_number: normalizedPhone,
                is_verified: true,
                last_login: new Date(),
            });
            customer = await this.customerRepository.save(customer);
        }
        else {
            customer.last_login = new Date();
            await this.customerRepository.save(customer);
        }
        return this.issueCustomerAppTokens(customer);
    }
    async loginWithGoogle(idToken) {
        const googleProfile = await this.verifyGoogleToken(idToken);
        if (!googleProfile) {
            throw new common_1.UnauthorizedException('Invalid Google ID token');
        }
        let customer = await this.findCustomerByEmail(googleProfile.email);
        if (customer) {
            if (googleProfile.picture && customer.avatar_url !== googleProfile.picture) {
                customer.avatar_url = googleProfile.picture;
            }
            customer.last_login = new Date();
            await this.customerRepository.save(customer);
            return this.issueCustomerAppTokens(customer);
        }
        customer = await this.findOrCreateGoogleCustomer(googleProfile);
        customer.last_login = new Date();
        await this.customerRepository.save(customer);
        return this.issueCustomerAppTokens(customer);
    }
    async findOrCreateGoogleCustomer(googleProfile) {
        const nameParts = googleProfile.name.split(' ');
        const googleIdShort = googleProfile.googleId.substring(0, 8);
        const timestampShort = Date.now().toString().slice(-9);
        const phonePlaceholder = `g_${googleIdShort}${timestampShort}`;
        const customer = this.customerRepository.create({
            email: googleProfile.email,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(' ') || null,
            avatar_url: googleProfile.picture || null,
            phone_number: phonePlaceholder,
            is_verified: true,
            last_login: new Date(),
        });
        return await this.customerRepository.save(customer);
    }
    async verifyGoogleToken(idToken) {
        try {
            if (!process.env.GOOGLE_CLIENT_ID) {
                console.error('GOOGLE_CLIENT_ID environment variable is not set');
                throw new Error('Google OAuth client ID not configured');
            }
            const clientIds = process.env.GOOGLE_CLIENT_ID.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
            if (clientIds.length === 0) {
                throw new Error('No valid Google OAuth client IDs configured');
            }
            const { OAuth2Client } = require('google-auth-library');
            let lastError = null;
            for (const clientId of clientIds) {
                try {
                    const client = new OAuth2Client(clientId);
                    const ticket = await client.verifyIdToken({
                        idToken,
                        audience: clientId,
                    });
                    const payload = ticket.getPayload();
                    if (!payload) {
                        console.warn(`Google token verification failed for client ID ${clientId}: No payload returned`);
                        continue;
                    }
                    console.debug(`Google token verified successfully with client ID: ${clientId.substring(0, 20)}...`);
                    return {
                        email: payload.email || '',
                        name: payload.name || payload.email || '',
                        picture: payload.picture,
                        googleId: payload.sub,
                    };
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    console.debug(`Token verification failed for client ID ${clientId}: ${lastError.message}`);
                    continue;
                }
            }
            if (lastError) {
                throw lastError;
            }
            throw new Error('Google token verification failed for all configured client IDs');
        }
        catch (error) {
            console.error('Google token verification error:', error);
            if (error instanceof Error && error.message.includes('Cannot find module')) {
                console.error('Google auth library not installed. Install with: npm install google-auth-library');
                console.error('Google login will not work until library is installed.');
            }
            return null;
        }
    }
    async register(name, email, phone_number, password) {
        if (!email && !phone_number) {
            throw new common_1.BadRequestException('Either email or phone_number is required');
        }
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new common_1.BadRequestException('Invalid email format');
            }
        }
        if (email) {
            const existingCustomerByEmail = await this.customerRepository.findOne({
                where: { email, is_deleted: false },
            });
            if (existingCustomerByEmail) {
                throw new common_1.ConflictException('This email is already registered. Please use a different email or try logging in.');
            }
        }
        if (phone_number) {
            const existingCustomerByPhone = await this.findCustomerByPhone(phone_number);
            if (existingCustomerByPhone) {
                throw new common_1.ConflictException('This phone number is already registered. Please use a different phone number or try logging in.');
            }
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        let first_name = null;
        let last_name = null;
        if (name) {
            const nameParts = name.trim().split(' ');
            first_name = nameParts[0] || null;
            last_name = nameParts.slice(1).join(' ') || null;
        }
        let finalPhoneNumber = phone_number;
        if (!finalPhoneNumber && email) {
            const emailHash = Buffer.from(email)
                .toString('base64')
                .slice(0, 8)
                .replace(/[^a-zA-Z0-9]/g, '');
            const shortTimestamp = Date.now().toString().slice(-8);
            finalPhoneNumber = `e_${emailHash}_${shortTimestamp}`;
        }
        else if (!finalPhoneNumber) {
            throw new common_1.BadRequestException('Either email or phone_number is required');
        }
        else {
            finalPhoneNumber = (0, string_util_1.normalizePhoneNumber)(finalPhoneNumber);
        }
        const customer = this.customerRepository.create({
            first_name,
            last_name,
            email: email || null,
            phone_number: finalPhoneNumber,
            password: hashedPassword,
            is_verified: email ? true : false,
            last_login: new Date(),
        });
        const savedCustomer = await this.customerRepository.save(customer);
        return this.issueCustomerTokens(savedCustomer);
    }
    async issueCustomerTokens(customer) {
        const payload = {
            sub: customer.id,
            email: customer.email || undefined,
            phone_number: customer.phone_number || undefined,
            role: user_role_enum_1.UserRole.USER,
            type: 'user',
        };
        const accessToken = this.jwtService.generateAccessToken(payload);
        const refreshToken = this.jwtService.generateRefreshToken(payload);
        await this.storeCustomerToken(refreshToken, customer.id);
        const userResponse = this.formatCustomerResponse(customer);
        try {
            const personalizedHoroscope = await this.horoscopeService.getHoroscopeForUser(customer.id, 'daily');
            userResponse.horoscope = personalizedHoroscope;
        }
        catch (error) {
        }
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: userResponse,
        };
    }
    async issueCustomerAppTokens(customer) {
        const payload = {
            sub: customer.id,
            email: customer.email || undefined,
            phone_number: customer.phone_number || undefined,
            role: user_role_enum_1.UserRole.USER,
            type: 'user',
        };
        const appSessionExpiration = this.getAppSessionExpiration();
        const accessToken = this.jwtService.generateAccessToken(payload, appSessionExpiration);
        const refreshToken = this.jwtService.generateRefreshToken(payload, appSessionExpiration);
        await this.storeCustomerRefreshToken(refreshToken, customer.id, appSessionExpiration, 'google');
        const userResponse = this.formatCustomerResponse(customer);
        try {
            const personalizedHoroscope = await this.horoscopeService.getHoroscopeForUser(customer.id, 'daily');
            userResponse.horoscope = personalizedHoroscope;
        }
        catch (error) {
        }
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: userResponse,
        };
    }
    async storeCustomerToken(token, customerId) {
        const payload = this.jwtService.verifyToken(token);
        if (!payload)
            return;
        const expiresAt = new Date(payload.exp * 1000);
        const customerToken = this.customerTokenRepository.create({
            token,
            customer_id: customerId,
            expires_at: expiresAt,
            is_revoked: false,
            login_method: 'password',
        });
        await this.customerTokenRepository.save(customerToken);
    }
    async storeCustomerRefreshToken(token, customerId, expiresIn, loginMethod = 'otp') {
        const payload = this.jwtService.verifyToken(token);
        if (!payload)
            return;
        let expiresAt;
        if (expiresIn) {
            const expiresInMs = this.parseExpiresIn(expiresIn);
            expiresAt = new Date(Date.now() + expiresInMs);
        }
        else {
            expiresAt = new Date(payload.exp * 1000);
        }
        const customerToken = this.customerTokenRepository.create({
            token,
            customer_id: customerId,
            expires_at: expiresAt,
            is_revoked: false,
            login_method: loginMethod,
        });
        await this.customerTokenRepository.save(customerToken);
    }
    formatCustomerResponse(customer) {
        return {
            id: customer.id,
            unique_id: customer.unique_id,
            name: customer.first_name && customer.last_name
                ? `${customer.first_name} ${customer.last_name}`
                : customer.first_name || customer.last_name || null,
            email: customer.email,
            phone_number: customer.phone_number,
            avatar_url: customer.avatar_url,
            role: 'user',
            is_verified: customer.is_verified,
            created_at: customer.added_date,
        };
    }
    async getCurrentUser(userPayload) {
        const userId = userPayload.id;
        const userType = userPayload.type || 'user';
        if (userType === 'admin') {
            const admin = await this.adminUserRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('Admin user not found');
            }
            return {
                id: admin.id,
                unique_id: admin.unique_id,
                name: admin.first_name && admin.last_name
                    ? `${admin.first_name} ${admin.last_name}`
                    : admin.first_name || admin.last_name || null,
                email: admin.email,
                username: admin.username,
                avatar_url: admin.avatar_url,
                role: 'admin',
                type: 'admin',
                is_active: admin.is_active,
                created_at: admin.added_date,
            };
        }
        else {
            const customer = await this.customerRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (!customer) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return this.formatCustomerResponse(customer);
        }
    }
    async refreshAccessToken(refreshTokenString) {
        const payload = this.jwtService.verifyToken(refreshTokenString);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        let customerToken = await this.customerTokenRepository.findOne({
            where: { token: refreshTokenString, is_revoked: false },
        });
        if (customerToken) {
            if (customerToken.expires_at < new Date()) {
                throw new common_1.UnauthorizedException('Refresh token expired or revoked');
            }
            const customer = await this.customerRepository.findOne({
                where: { id: customerToken.customer_id, is_deleted: false },
            });
            if (!customer) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const appSessionDays = this.configService.get('APP_SESSION_DAYS', 90);
            const originalExpiration = payload.exp ? payload.exp * 1000 : 0;
            const now = Date.now();
            const daysUntilExpiration = (originalExpiration - now) / (1000 * 60 * 60 * 24);
            const isAppToken = daysUntilExpiration >= (appSessionDays - 5) && daysUntilExpiration <= (appSessionDays + 5);
            const newPayload = {
                sub: customer.id,
                phone_number: customer.phone_number || undefined,
                email: customer.email || undefined,
                role: user_role_enum_1.UserRole.USER,
                type: 'user',
            };
            const expiresIn = isAppToken ? this.getAppSessionExpiration() : undefined;
            const newAccessToken = this.jwtService.generateAccessToken(newPayload, expiresIn);
            const newRefreshToken = this.jwtService.generateRefreshToken(newPayload, expiresIn);
            customerToken.is_revoked = true;
            await this.customerTokenRepository.save(customerToken);
            await this.storeCustomerRefreshToken(newRefreshToken, customer.id, expiresIn, customerToken.login_method || 'password');
            return {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                user: this.formatCustomerResponse(customer),
            };
        }
        const tokenRecord = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenString, is_revoked: false },
        });
        if (!tokenRecord || tokenRecord.expires_at < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired or revoked');
        }
        const customer = await this.customerRepository.findOne({
            where: { id: payload.sub, is_deleted: false },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const appSessionDays = this.configService.get('APP_SESSION_DAYS', 90);
        const originalExpiration = payload.exp ? payload.exp * 1000 : 0;
        const now = Date.now();
        const daysUntilExpiration = (originalExpiration - now) / (1000 * 60 * 60 * 24);
        const isAppToken = daysUntilExpiration >= (appSessionDays - 5) && daysUntilExpiration <= (appSessionDays + 5);
        const newPayload = {
            sub: customer.id,
            phone_number: customer.phone_number || undefined,
            email: customer.email || undefined,
            role: user_role_enum_1.UserRole.USER,
            type: 'user',
        };
        const expiresIn = isAppToken ? this.getAppSessionExpiration() : undefined;
        const newAccessToken = this.jwtService.generateAccessToken(newPayload, expiresIn);
        const newRefreshToken = this.jwtService.generateRefreshToken(newPayload, expiresIn);
        tokenRecord.is_revoked = true;
        await this.refreshTokenRepository.save(tokenRecord);
        await this.storeCustomerRefreshToken(newRefreshToken, customer.id, expiresIn, 'password');
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            user: this.formatCustomerResponse(customer),
        };
    }
    async findCustomerByPhone(phoneNumber) {
        const normalizedPhone = (0, string_util_1.normalizePhoneNumber)(phoneNumber);
        const digitsOnly = normalizedPhone.replace(/\D+/g, '');
        const variationsSet = new Set();
        variationsSet.add(normalizedPhone.trim());
        variationsSet.add(`+${normalizedPhone.trim()}`);
        variationsSet.add(digitsOnly);
        if (digitsOnly.length > 10) {
            variationsSet.add(digitsOnly.slice(-10));
        }
        variationsSet.add(phoneNumber.trim());
        for (const variation of variationsSet) {
            if (!variation)
                continue;
            const customer = await this.customerRepository.findOne({
                where: { phone_number: variation, is_deleted: false },
            });
            if (customer)
                return customer;
        }
        return null;
    }
    async findCustomerByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const customer = await this.customerRepository.findOne({
            where: { email: normalizedEmail, is_deleted: false },
        });
        return customer || null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __param(2, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_token_entity_1.CustomerToken)),
    __param(4, (0, typeorm_1.InjectRepository)(admin_token_entity_1.AdminToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        otp_service_1.OtpService,
        jwt_service_1.AuthJwtService,
        config_1.ConfigService,
        horoscope_service_1.HoroscopeService])
], AuthService);
//# sourceMappingURL=auth.service.js.map