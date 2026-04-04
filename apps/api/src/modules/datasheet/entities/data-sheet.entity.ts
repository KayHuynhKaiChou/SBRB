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
import { User } from '../../auth/entities/user.entity';
import { Business } from '../../business/entities/business.entity';

@Entity('data_sheets')
export class DataSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
  originalFilename: string | null;

  @Column({ name: 'period_type', type: 'varchar', length: 20, default: 'month' })
  periodType: string;

  @Column({ name: 'period_headers', type: 'jsonb', default: '[]' })
  periodHeaders: string[];

  @Column({ name: 'series_count', type: 'integer', default: 0 })
  seriesCount: number;

  @Column({ name: 'period_count', type: 'integer', default: 0 })
  periodCount: number;

  @Column({ type: 'varchar', length: 20, default: 'processing' })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'imported_at', type: 'timestamptz', nullable: true })
  importedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
