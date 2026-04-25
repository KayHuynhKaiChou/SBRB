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
import { Tab } from '../../tab/entities/tab.entity';
import { DataSheet } from '../../datasheet/entities/data-sheet.entity';

@Entity('widgets')
@Index(['tabId', 'x', 'y'])
export class Widget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tab_id', type: 'uuid' })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tab_id' })
  tab: Tab;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @Column({ name: 'metric_name', type: 'varchar', length: 80, nullable: true })
  metricName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @Column({ type: 'integer', default: 20 })
  x: number;

  @Column({ type: 'integer', default: 20 })
  y: number;

  @Column({ type: 'integer', default: 1000 })
  w: number;

  @Column({ type: 'integer', default: 500 })
  h: number;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, unknown>;

  @Column({ name: 'data_sheet_id', type: 'uuid', nullable: true })
  dataSheetId: string | null;

  @ManyToOne(() => DataSheet, (s) => s.widgets, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'data_sheet_id' })
  dataSheet: DataSheet | null;

  @Column({ name: 'selected_series', type: 'jsonb', default: '[]' })
  selectedSeries: string[];

  @Column({ name: 'selected_periods', type: 'jsonb', nullable: true })
  selectedPeriods: string[] | null;

  @Column({ name: 'is_restricted', type: 'boolean', default: false })
  isRestricted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
