import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Business } from '../../business/entities/business.entity';
import { DataSheet } from './data-sheet.entity';

@Entity('import_batches')
export class ImportBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'uploader_id', type: 'uuid' })
  uploaderId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'data_sheet_id', type: 'uuid', nullable: true })
  dataSheetId: string | null;

  @ManyToOne(() => DataSheet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'data_sheet_id' })
  dataSheet: DataSheet | null;

  @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
  originalFilename: string | null;

  @Column({ type: 'varchar', length: 20, default: 'processing' })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'success_rows', type: 'integer', default: 0 })
  successRows: number;

  @Column({ name: 'error_rows', type: 'integer', default: 0 })
  errorRows: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
