import { IsInt, IsPositive, Min } from 'class-validator';

/** SRS 4.4.3/4.4.5 — Widget position update payload (REST only — high-frequency) */
export class UpdateWidgetPositionDto {
  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;

  @IsInt()
  @IsPositive()
  w: number;

  @IsInt()
  @IsPositive()
  h: number;
}
