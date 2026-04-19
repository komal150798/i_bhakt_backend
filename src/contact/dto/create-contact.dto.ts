import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+91 9876543210', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'General Inquiry' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'I have a question about...' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
