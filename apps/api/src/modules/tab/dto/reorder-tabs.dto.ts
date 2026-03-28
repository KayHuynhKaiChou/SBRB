import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

/** Single tab order item for batch reorder */
@InputType('TabOrderInput')
export class TabOrderItemDto {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  order: number;
}
