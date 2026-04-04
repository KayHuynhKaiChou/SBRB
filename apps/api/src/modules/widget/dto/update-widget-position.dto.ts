import { IsNumber } from 'class-validator';

/** Widget position update payload (REST only — high-frequency). Validation handled by FE. */
export class UpdateWidgetPositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  w: number;

  @IsNumber()
  h: number;
}
