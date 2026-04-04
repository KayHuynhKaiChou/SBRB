import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

@InputType()
export class CreateDepartmentDto {
  @Field(() => ID)
  @IsUUID()
  businessId: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  name: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
