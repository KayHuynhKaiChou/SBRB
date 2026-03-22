import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL SessionType — mirrors Session entity */
@ObjectType('Session')
export class SessionType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  deviceName?: string | null;

  @Field({ nullable: true })
  ipAddress?: string | null;

  @Field()
  lastActiveAt: Date;

  @Field()
  createdAt: Date;
}
