import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DataSheet } from './data-sheet.entity';
import { Department } from '../../department/entities/department.entity';

@Entity('data_series')
@Index(['dataSheetId', 'rowIndex'])
export class DataSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_sheet_id', type: 'uuid' })
  dataSheetId: string;

  @ManyToOne(() => DataSheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_sheet_id' })
  dataSheet: DataSheet;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  @Index()
  departmentId: string | null;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'series_name', type: 'varchar', length: 200 })
  seriesName: string;

  @Column({ name: 'row_index', type: 'smallint' })
  rowIndex: number;

  @Column({ type: 'jsonb', default: '{}' })
  values: Record<string, number>;
}
