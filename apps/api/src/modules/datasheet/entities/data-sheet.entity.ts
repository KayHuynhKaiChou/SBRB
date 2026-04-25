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
import { User } from '../../auth/entities/user.entity';
import { Business } from '../../business/entities/business.entity';
import { Widget } from '../../widget/entities/widget.entity';

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

  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors: any;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
  originalFilename: string | null;

  @Column({ name: 'template_type', type: 'varchar', length: 20, default: 'simple' })
  templateType: string;

  @Column({ name: 'period_type', type: 'varchar', length: 20, default: 'month' })
  periodType: string;

  @Column({ name: 'period_headers', type: 'jsonb', default: '[]' })
  periodHeaders: string[];

  /** Lifecycle flag: 'active' | 'inactive'. Inactive sheets are hidden from widget-
   *  creation pickers but existing widgets keep their link. Failed imports are rolled
   *  back (row deleted) so 'error' / 'processing' no longer appear here. */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'imported_at', type: 'timestamptz', nullable: true })
  importedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Widget, (w) => w.dataSheet)
  widgets: Widget[];
}
