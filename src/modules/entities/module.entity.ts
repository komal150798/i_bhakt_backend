import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ModuleType } from '../../common/enums/module-type.enum';
import { Plan } from '../../plans/entities/plan.entity';

@Entity('modules')
@Index(['slug', 'is_enabled', 'is_deleted'])
@Index(['module_type', 'is_enabled'])
export class Module extends BaseEntity {
  @Column({ type: 'enum', enum: ModuleType, name: 'module_type' })
  module_type: ModuleType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'icon_name' })
  icon_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'route_path' })
  route_path: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  image_url: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'badge_color' })
  badge_color: string | null;

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sort_order: number;

  @Column({ type: 'boolean', default: false, name: 'is_premium' })
  is_premium: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'required_permissions' })
  required_permissions: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToMany(() => Plan, (plan) => plan.modules)
  plans: Plan[];
}
