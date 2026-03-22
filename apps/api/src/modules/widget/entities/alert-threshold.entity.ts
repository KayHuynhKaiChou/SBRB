import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Widget } from './widget.entity';

@Entity('alert_thresholds')
export class AlertThreshold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'widget_id', type: 'uuid' })
  @Index()
  widgetId: string;

  @ManyToOne(() => Widget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'widget_id' })
  widget: Widget;

  @Column({ type: 'varchar', length: 10 })
  condition: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  threshold: number;

  @Column({ type: 'jsonb', default: '["in-app"]' })
  channels: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
