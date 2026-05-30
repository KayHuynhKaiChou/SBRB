import { Field, ID, ObjectType } from '@nestjs/graphql';

/** Single row returned by adminAuditLog query. SRS §5.16 */
@ObjectType()
export class AdminAuditRowType {
  @Field(() => ID)
  id: string;

  @Field()
  action: string;

  @Field(() => ID)
  actorId: string;

  /** Populated from JOIN users.email — 'system' if actor not found. */
  @Field()
  actorEmail: string;

  @Field(() => ID, { nullable: true })
  targetId: string | null;

  @Field(() => String, { nullable: true })
  targetType: string | null;

  @Field(() => String, { nullable: true })
  targetName: string | null;

  @Field(() => ID, { nullable: true })
  businessId: string | null;

  /** JSON metadata serialized as string — safe to render in FE. */
  @Field()
  meta: string;

  @Field(() => Date)
  createdAt: Date;
}
