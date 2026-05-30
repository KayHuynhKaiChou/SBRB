import { Field, Int, ObjectType } from '@nestjs/graphql';

/** Platform-wide aggregate metrics for admin dashboard. SRS §5.9, §5.17 */
@ObjectType()
export class AdminMetricsType {
  @Field(() => Int)
  totalBusinesses: number;

  @Field(() => Int)
  activeBusinesses: number;

  @Field(() => Int)
  inactiveBusinesses: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  newBusinessesLast30d: number;

  @Field(() => Int)
  newUsersLast30d: number;
}
