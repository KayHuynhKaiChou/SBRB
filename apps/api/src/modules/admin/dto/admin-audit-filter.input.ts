import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Filter params for adminAuditLog query. All fields optional. */
@InputType()
export class AdminAuditFilterInput {
  /** Search by actor email using ILIKE. */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  actorEmail?: string;

  /** Exact match on action string (e.g. 'business.inactivate'). */
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  /** Filter entries created >= this date. */
  @Field(() => Date, { nullable: true })
  @IsOptional()
  dateFrom?: Date;

  /** Filter entries created <= this date. */
  @Field(() => Date, { nullable: true })
  @IsOptional()
  dateTo?: Date;
}
