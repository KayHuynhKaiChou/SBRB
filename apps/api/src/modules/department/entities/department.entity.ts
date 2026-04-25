import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { DepartmentMember } from './department-member.entity';

@Entity('departments')
@Index('uniq_root_per_business', ['businessId'], {
  unique: true,
  where: '"is_root" = true',
})
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Department, (dept) => dept.children, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Department | null;

  @OneToMany(() => Department, (dept) => dept.parent)
  children: Department[];

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'is_root', type: 'boolean', default: false })
  isRoot: boolean;

  @Column({ name: 'position_x', type: 'float', nullable: true })
  positionX: number | null;

  @Column({ name: 'position_y', type: 'float', nullable: true })
  positionY: number | null;

  @OneToMany(() => DepartmentMember, (dm) => dm.department)
  members: DepartmentMember[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
