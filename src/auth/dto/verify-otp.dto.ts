import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  @IsString()
  @MinLength(8)
  @MaxLength(15)
  phone_number: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  otp_code: string;

  @ApiProperty({ required: false, description: 'Set to true if this is a login attempt' })
  @IsOptional()
  @IsBoolean()
  is_login?: boolean;
}







