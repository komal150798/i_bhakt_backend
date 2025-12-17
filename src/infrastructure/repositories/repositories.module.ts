import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { Module as ModuleEntity } from '../../modules/entities/module.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { CMSPage } from '../../cms/entities/cms-page.entity';
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';

// Repository implementations
import { PlanRepository } from './plan.repository';
import { KundliRepository } from './kundli.repository';
import { UserRepository } from './user.repository';
import { OrderRepository } from './order.repository';
import { PaymentRepository } from './payment.repository';
import { SubscriptionRepository } from './subscription.repository';
import { CMSRepository } from './cms.repository';
import { KarmaRepository } from './karma.repository';
import { ManifestationRepository } from './manifestation.repository';

// Repository interfaces (for injection tokens)
import { IPlanRepository } from '../../core/interfaces/repositories/plan-repository.interface';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { IUserRepository } from '../../core/interfaces/repositories/user-repository.interface';
import { IOrderRepository } from '../../core/interfaces/repositories/order-repository.interface';
import { IPaymentRepository } from '../../core/interfaces/repositories/payment-repository.interface';
import { ISubscriptionRepository } from '../../core/interfaces/repositories/subscription-repository.interface';
import { ICMSRepository } from '../../core/interfaces/repositories/cms-repository.interface';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
import { IManifestationRepository } from '../../core/interfaces/repositories/manifestation-repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      ModuleEntity,
      Kundli,
      User,
      Order,
      Payment,
      Subscription,
      CMSPage,
      KarmaEntry,
      ManifestationLog,
    ]),
  ],
  providers: [
    // Provide implementations bound to interfaces
    {
      provide: 'IPlanRepository',
      useClass: PlanRepository,
    },
    {
      provide: 'IKundliRepository',
      useClass: KundliRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
    {
      provide: 'ISubscriptionRepository',
      useClass: SubscriptionRepository,
    },
    {
      provide: 'ICMSRepository',
      useClass: CMSRepository,
    },
    {
      provide: 'IKarmaRepository',
      useClass: KarmaRepository,
    },
    {
      provide: 'IManifestationRepository',
      useClass: ManifestationRepository,
    },
  ],
  exports: [
    'IPlanRepository',
    'IKundliRepository',
    'IUserRepository',
    'IOrderRepository',
    'IPaymentRepository',
    'ISubscriptionRepository',
    'ICMSRepository',
    'IKarmaRepository',
    'IManifestationRepository',
  ],
})
export class RepositoriesModule {}

