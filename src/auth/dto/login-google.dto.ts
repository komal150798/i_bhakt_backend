import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginGoogleDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Google ID token from Google Sign-In',
  })
  @IsString()
  id_token: string;
}

