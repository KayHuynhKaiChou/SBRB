import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for Business (incl. approval + KYB profile). */
@ObjectType()
export class BusinessType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  industry: string;

  @Field(() => String)
  currency: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => Int)
  weekStart: number;

  @Field(() => Int)
  canvasWidth: number;

  @Field(() => Int)
  canvasHeight: number;

  @Field(() => Int)
  snapGrid: number;

  @Field(() => String)
  ownerId: string;

  /** Unified lifecycle: pending | approved | rejected | inactive. */
  @Field(() => String)
  status: string;

  @Field(() => Date, { nullable: true })
  inactivatedAt?: Date | null;

  @Field(() => String, { nullable: true })
  inactiveReason?: string | null;

  // ===== Approval / verification metadata =====
  @Field(() => String, { nullable: true })
  rejectionReason?: string | null;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  rejectedAt?: Date | null;

  // ===== KYB profile =====
  @Field(() => String, { nullable: true })
  legalName?: string | null;

  @Field(() => String, { nullable: true })
  taxCode?: string | null;

  @Field(() => String, { nullable: true })
  businessType?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  contactPhone?: string | null;

  @Field(() => String, { nullable: true })
  contactEmail?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  bannerUrl?: string | null;

  @Field(() => String, { nullable: true })
  licenseFileUrl?: string | null;

  @Field(() => Int, { nullable: true })
  foundedYear?: number | null;

  @Field(() => String, { nullable: true })
  companySize?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
