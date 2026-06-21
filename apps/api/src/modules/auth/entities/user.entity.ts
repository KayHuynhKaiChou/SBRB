import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  EUserAccountStatus,
  type TPlatformRole,
  type TUserAccountStatus,
} from '@sbrb/shared-constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 10, default: 'vi' })
  language: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Index()
  @Column({ name: 'platform_role', type: 'varchar', length: 20, nullable: true })
  platformRole: TPlatformRole;

  /**
   * Global account lifecycle status — replaces the former is_disabled flag.
   * pending → active (set password) ↔ inactive (deactivate). Indexed for /members filtering.
   */
  @Index('idx_users_status')
  @Column({ type: 'varchar', length: 20, default: EUserAccountStatus.ACTIVE })
  status: TUserAccountStatus;

  /** Audit timestamp — set whenever status changes (parity with former disabled_at). */
  @Column({ name: 'status_changed_at', type: 'timestamptz', nullable: true })
  statusChangedAt: Date | null;
}
