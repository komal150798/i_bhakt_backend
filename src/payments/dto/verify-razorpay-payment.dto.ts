import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyRazorpayPaymentDto {
  @ApiProperty({ example: 'order_Rxxxxx' })
  @IsString()
  @MinLength(8)
  razorpay_order_id: string;

  @ApiProperty({ example: 'pay_Rxxxxx' })
  @IsString()
  @MinLength(8)
  razorpay_payment_id: string;

  @ApiProperty({ description: 'Signature from Razorpay Checkout handler' })
  @IsString()
  @MinLength(8)
  razorpay_signature: string;
}
