import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetHoroscopeDto {
  @ApiProperty({
    description: 'Zodiac sign name',
    example: 'Aries',
    enum: [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ])
  sign: string;

  @ApiProperty({
    description: 'Horoscope type',
    example: 'daily',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['daily', 'weekly', 'monthly'])
  type: 'daily' | 'weekly' | 'monthly';
}


