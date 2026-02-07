import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'node:crypto';
import { Customer } from '../../users/entities/customer.entity';
import { normalizePhoneNumber } from '../../common/utils/string.util';

export interface IssueOtpResult {
  otp_code: string;
  expires_at: Date;
  purpose: string;
  remaining_attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  /** OTP validity duration in seconds (5 minutes) */
  private readonly OTP_EXPIRY_SECONDS = 5 * 60;

  /** Maximum verification attempts before locking */
  private readonly MAX_ATTEMPTS = 5;

  /** Cooldown between OTP resends in seconds (60 seconds) */
  private readonly RESEND_COOLDOWN_SECONDS = 60;

  /** OTP code length */
  private readonly OTP_LENGTH = 6;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Generate a cryptographically secure OTP code
   */
  generateOtp(length: number = this.OTP_LENGTH): string {
    const max = Math.pow(10, length);
    const randomNumber = crypto.randomInt(0, max);
    return randomNumber.toString().padStart(length, '0');
  }

  /**
   * Find customer by phone or email identifier.
   * Tries multiple phone number variations to handle different storage formats.
   */
  private async findCustomerByIdentifier(identifier: string): Promise<Customer | null> {
    // Check if identifier looks like an email
    if (identifier.includes('@')) {
      return this.customerRepository.findOne({
        where: { email: identifier.trim().toLowerCase(), is_deleted: false },
      });
    }

    // Phone number - try multiple variations
    const normalizedPhone = normalizePhoneNumber(identifier);
    const digitsOnly = normalizedPhone.replaceAll(/\D+/g, '');

    const variations = new Set<string>();
    variations.add(normalizedPhone.trim());
    variations.add(`+${normalizedPhone.trim()}`);
    variations.add(digitsOnly);
    if (digitsOnly.length > 10) {
      variations.add(digitsOnly.slice(-10));
    }
    variations.add(identifier.trim());

    for (const variation of variations) {
      if (!variation) continue;
      const customer = await this.customerRepository.findOne({
        where: { phone_number: variation, is_deleted: false },
      });
      if (customer) return customer;
    }

    return null;
  }

  /**
   * Issue a new OTP for the given identifier (phone/email)
   * - Finds the customer by phone/email
   * - If customer doesn't exist, throws NotFoundException
   * - Stores OTP code + expiry on the customer row
   * - Returns OTP details
   */
  async issueOtp(
    identifier: string,
    purpose: string = 'login',
  ): Promise<IssueOtpResult> {
    const customer = await this.findCustomerByIdentifier(identifier);

    if (!customer) {
      this.logger.warn(`OTP requested for non-existent user: ${identifier}`);
      throw new NotFoundException('User not found. Please register first.');
    }

    // Generate new OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_SECONDS * 1000);

    // Store OTP on customer record
    customer.otp_code = otpCode;
    customer.otp_expires_at = expiresAt;
    customer.otp_attempts = 0;
    customer.otp_max_attempts = this.MAX_ATTEMPTS;
    customer.otp_purpose = purpose;
    customer.otp_verified_at = null;

    await this.customerRepository.save(customer);

    this.logger.log(`OTP issued for ${identifier} (purpose: ${purpose})`);

    return {
      otp_code: otpCode,
      expires_at: expiresAt,
      purpose,
      remaining_attempts: this.MAX_ATTEMPTS,
    };
  }

  /**
   * Verify an OTP code for the given identifier
   * - Finds the customer by phone/email
   * - Checks OTP fields on the customer record
   * - Tracks failed attempts and locks after max attempts
   * - Clears OTP fields on success
   */
  async verifyOtp(identifier: string, otpCode: string): Promise<boolean> {
    const customer = await this.findCustomerByIdentifier(identifier);

    if (!customer) {
      this.logger.warn(`No customer found for OTP verification: ${identifier}`);
      return false;
    }

    // Check if OTP exists
    if (!customer.otp_code) {
      this.logger.warn(`No OTP issued for ${identifier}`);
      return false;
    }

    // Check if expired
    if (!customer.otp_expires_at || customer.otp_expires_at < new Date()) {
      // Clear expired OTP
      customer.otp_code = null;
      customer.otp_expires_at = null;
      customer.otp_purpose = null;
      await this.customerRepository.save(customer);
      this.logger.warn(`OTP expired for ${identifier}`);
      return false;
    }

    // Check if max attempts reached
    if (customer.otp_attempts >= customer.otp_max_attempts) {
      // Clear locked OTP
      customer.otp_code = null;
      customer.otp_expires_at = null;
      customer.otp_purpose = null;
      await this.customerRepository.save(customer);
      this.logger.warn(`Max OTP attempts reached for ${identifier}`);
      return false;
    }

    // Increment attempt count
    customer.otp_attempts += 1;

    // Verify the code
    if (customer.otp_code !== otpCode) {
      await this.customerRepository.save(customer);
      this.logger.warn(
        `Invalid OTP attempt for ${identifier} (attempt ${customer.otp_attempts}/${customer.otp_max_attempts})`,
      );
      return false;
    }

    // OTP is valid - clear OTP fields and mark verified
    customer.otp_verified_at = new Date();
    customer.otp_code = null;
    customer.otp_expires_at = null;
    customer.otp_purpose = null;
    customer.otp_attempts = 0;

    await this.customerRepository.save(customer);

    this.logger.log(`OTP verified successfully for ${identifier}`);
    return true;
  }

  /**
   * Check if resend cooldown is active for the given identifier
   * Returns seconds remaining if cooldown is active, 0 if can resend
   */
  async getResendCooldown(identifier: string): Promise<number> {
    const customer = await this.findCustomerByIdentifier(identifier);
    if (!customer?.otp_expires_at) return 0;
    const issuedAt = new Date(customer.otp_expires_at.getTime() - this.OTP_EXPIRY_SECONDS * 1000);
    const elapsed = (Date.now() - issuedAt.getTime()) / 1000;
    const remaining = this.RESEND_COOLDOWN_SECONDS - elapsed;
    return remaining > 0 ? Math.ceil(remaining) : 0;
  }
}
