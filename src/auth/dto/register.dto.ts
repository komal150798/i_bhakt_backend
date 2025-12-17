import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'Komal Choudhari', 
    description: 'Full name of the user',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ 
    example: 'kuc9815@gmail.com', 
    description: 'Email address (must be unique)',
    required: false 
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ 
    example: '+919876543210', 
    description: 'Phone number (required if email not provided)',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone_number?: string;

  @ApiProperty({ 
    example: 'SecurePassword123!', 
    description: 'Password (min 6 characters)',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}


