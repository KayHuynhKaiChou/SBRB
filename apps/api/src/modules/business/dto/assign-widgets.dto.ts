import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsUUID } from 'class-validator';

/** SRS 4.2.2 — Assign widgets to staff input */
@InputType()
export class AssignWidgetsDto {
  @Field(() => [String])
  @IsArray()
  @IsUUID('4', { each: true })
  widgetIds: string[];
}
