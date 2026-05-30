import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AdminBusinessRowType } from './admin-business-row.type';

@ObjectType()
export class AdminBusinessListResultType {
  @Field(() => [AdminBusinessRowType])
  rows: AdminBusinessRowType[];

  @Field(() => Int)
  total: number;
}
