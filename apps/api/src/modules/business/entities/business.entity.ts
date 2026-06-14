import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EBusinessStatus,
  type TBusinessStatus,
} from '@sbrb/shared-constants';
import { User } from '../../auth/entities/user.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'Other' })
  industry: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'week_start', type: 'smallint', default: 1 })
  weekStart: number;

  @Column({ name: 'canvas_width', type: 'integer', default: 3200 })
  canvasWidth: number;

  @Column({ name: 'canvas_height', type: 'integer', default: 4800 })
  canvasHeight: number;

  @Column({ name: 'snap_grid', type: 'smallint', default: 20 })
  snapGrid: number;

  // Unified lifecycle status (pending/approved/rejected/inactive). New businesses
  // start PENDING (set explicitly in BusinessCrudService.create()); admin drives the rest.
  @Column({ type: 'varchar', length: 20, default: EBusinessStatus.PENDING })
  status: TBusinessStatus;

  @Column({ name: 'inactivated_at', type: 'timestamptz', nullable: true })
  inactivatedAt: Date | null;

  @Column({ name: 'inactivated_by', type: 'uuid', nullable: true })
  inactivatedBy: string | null;

  @Column({ name: 'inactive_reason', type: 'text', nullable: true })
  inactiveReason: string | null;

  // ===== Verification / approval audit metadata (docs/business-approval-rules.md §3) =====
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy: string | null;

  // ===== KYB business profile (docs/business-approval-rules.md §4) =====
  @Column({ name: 'legal_name', type: 'varchar', length: 150, nullable: true })
  legalName: string | null;

  @Column({ name: 'tax_code', type: 'varchar', length: 20, nullable: true })
  taxCode: string | null;

  @Column({ name: 'business_type', type: 'varchar', length: 30, nullable: true })
  businessType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl: string | null;

  @Column({ name: 'license_file_url', type: 'text', nullable: true })
  licenseFileUrl: string | null;

  @Column({ name: 'founded_year', type: 'smallint', nullable: true })
  foundedYear: number | null;

  @Column({ name: 'company_size', type: 'varchar', length: 20, nullable: true })
  companySize: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
