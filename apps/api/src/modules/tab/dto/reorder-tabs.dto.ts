import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

/** Single tab order item for batch reorder */
@InputType()
export class TabOrderItemDto {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  position: number;
}
