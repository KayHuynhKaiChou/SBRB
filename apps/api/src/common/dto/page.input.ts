import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Cursor-less offset pagination input — used by admin queries.
 * Hard-capped at 100 rows per request (enforced in service layer).
 */
@InputType()
export class PageInput {
  @Field(() => Int, { defaultValue: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { defaultValue: 20, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
