import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Create business input — now collects full KYB profile (owner signup wizard step 2).
 * Required: name, legalName, taxCode, address, contactPhone, licenseFileUrl.
 * See docs/business-approval-rules.md §4.
 */
@InputType()
export class CreateBusinessDto {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field(() => String, { nullable: true, defaultValue: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  // ===== KYB identity =====
  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  legalName: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  taxCode: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessType?: string;

  // ===== Contact =====
  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address: string;

  @Field(() => String)
  @IsString()
  @MaxLength(30)
  contactPhone: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // ===== Classification =====
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  foundedYear?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1500)
  companySize?: number;

  // ===== Assets (URLs returned by the signed-upload flow) =====
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bannerUrl?: string;

  /** Business licence document (private bucket). Required to submit for review. */
  @Field(() => String)
  @IsString()
  @MaxLength(1000)
  licenseFileUrl: string;
}
