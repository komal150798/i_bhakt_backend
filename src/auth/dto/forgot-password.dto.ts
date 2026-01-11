import { IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendForgotPasswordOtpDto {
  @ApiProperty({ example: '+1234567890', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(15)
  phone_number?: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+1234567890', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(15)
  phone_number?: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  otp_code: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  new_password: string;
}
