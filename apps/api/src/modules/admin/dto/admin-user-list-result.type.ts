import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AdminUserRowType } from './admin-user-row.type';

/** Paginated result for adminUsers query. SRS §5.9 */
@ObjectType()
export class AdminUserListResultType {
  @Field(() => [AdminUserRowType])
  rows: AdminUserRowType[];

  @Field(() => Int)
  total: number;
}
