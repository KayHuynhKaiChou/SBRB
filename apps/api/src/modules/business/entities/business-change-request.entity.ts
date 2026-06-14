import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EBusinessChangeRequestStatus,
  type TBusinessChangeRequestStatus,
} from '@sbrb/shared-constants';
import { User } from '../../auth/entities/user.entity';
import { Business } from './business.entity';

/**
 * Shadow/diff record holding owner-proposed changes to an already-approved business.
 * Live `businesses` row is only updated when an admin approves the request.
 * At most one PENDING request per business (partial unique index, see migration).
 * See docs/business-approval-rules.md §5.
 */
@Entity('business_change_requests')
@Index('idx_bcr_business_status', ['businessId', 'status'])
export class BusinessChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_by' })
  requester: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: EBusinessChangeRequestStatus.PENDING,
  })
  status: TBusinessChangeRequestStatus;

  /** Only changed fields: { field: { old, new } }. */
  @Column({ type: 'jsonb', default: '{}' })
  changes: Record<string, { old: unknown; new: unknown }>;

  @Column({ name: 'review_reason', type: 'text', nullable: true })
  reviewReason: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
