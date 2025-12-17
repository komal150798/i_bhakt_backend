import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'komal' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'komal' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  password: string;
}







