import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../auth.service';
import { SendOtpDto } from '../../dto/send-otp.dto';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { LoginGoogleDto } from '../../dto/login-google.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { IsEmail, IsString } from 'class-validator';

// DTOs for email OTP
class SendEmailOtpDto {
  @IsEmail()
  email: string;
}

class VerifyEmailOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp_code: string;

  is_login?: boolean;
}

@ApiTags('Auth (App)')
@Controller('app/auth')
export class AppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    const result = await this.authService.sendOtp(dto.phone_number);
    
    // App-specific response format
    return {
      success: true,
      message: result.message,
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access/refresh tokens (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP verified, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(
      dto.phone_number,
      dto.otp_code,
      dto.is_login || false,
    );
    
    // App-specific response format
    return {
      success: result.success,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
      },
    };
  }

  @Post('otp/email/send')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email address (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendEmailOtp(@Body() dto: SendEmailOtpDto) {
    const result = await this.authService.sendEmailOtp(dto.email);
    
    return {
      success: true,
      message: result.message,
      ...(result.debug_code && { debug_code: result.debug_code }),
    };
  }

  @Post('otp/email/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP and get access/refresh tokens (Mobile App)' })
  @ApiResponse({ status: 200, description: 'OTP verified, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto) {
    const result = await this.authService.verifyEmailOtp(
      dto.email,
      dto.otp_code,
      dto.is_login || false,
    );
    
    return {
      success: result.success,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
      },
    };
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google (Mobile App)' })
  @ApiResponse({ status: 200, description: 'Google login successful, tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid Google ID token' })
  async loginWithGoogle(@Body() dto: LoginGoogleDto) {
    const result = await this.authService.loginWithGoogle(dto.id_token);
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (Mobile App)' })
  @ApiResponse({ status: 200, description: 'New tokens generated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshAccessToken(dto.refresh_token);
    
    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token (Mobile App)' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refresh_token);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}





