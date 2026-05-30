import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AdminAuditRowType } from './admin-audit-row.type';

/** Paginated result for adminAuditLog query. */
@ObjectType()
export class AdminAuditListResultType {
  @Field(() => [AdminAuditRowType])
  rows: AdminAuditRowType[];

  @Field(() => Int)
  total: number;
}
