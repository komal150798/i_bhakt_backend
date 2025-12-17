import { ApiProperty } from '@nestjs/swagger';

export class HoroscopeResponseDto {
  @ApiProperty()
  sign: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  prediction: string;

  @ApiProperty({ required: false })
  love?: string;

  @ApiProperty({ required: false })
  career?: string;

  @ApiProperty({ required: false })
  health?: string;

  @ApiProperty({ required: false })
  finance?: string;

  @ApiProperty({ required: false })
  lucky_number?: string;

  @ApiProperty({ required: false })
  lucky_color?: string;

  @ApiProperty({ required: false })
  compatibility?: string;

  @ApiProperty({ required: false })
  mood?: string;

  @ApiProperty({ required: false })
  full_data?: Record<string, any>;
}


