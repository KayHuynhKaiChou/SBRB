import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL SessionType — mirrors Session entity */
@ObjectType('Session')
export class SessionType {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  deviceName?: string | null;

  @Field(() => String, { nullable: true })
  ipAddress?: string | null;

  @Field(() => Date)
  lastActiveAt: Date;

  @Field(() => Date)
  createdAt: Date;
}
