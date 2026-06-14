import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** Owner personal info shown to admin in the review drawer. */
@ObjectType()
export class AdminBusinessOwnerType {
  @Field(() => ID)
  id: string;

  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;
}

/** Full business detail for admin verification review (KYB + owner + signed licence URL). */
@ObjectType()
export class AdminBusinessDetailType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  industry: string;

  @Field()
  currency: string;

  @Field()
  status: string;

  @Field(() => String, { nullable: true })
  rejectionReason?: string | null;

  @Field(() => Int)
  memberCount: number;

  // KYB
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
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  bannerUrl?: string | null;

  /** Short-lived signed URL to the private licence document (null if none/unavailable). */
  @Field(() => String, { nullable: true })
  licenseSignedUrl?: string | null;

  @Field(() => Int, { nullable: true })
  foundedYear?: number | null;

  @Field(() => String, { nullable: true })
  companySize?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => AdminBusinessOwnerType)
  owner: AdminBusinessOwnerType;
}
