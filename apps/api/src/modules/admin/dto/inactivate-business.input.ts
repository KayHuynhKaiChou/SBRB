import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class InactivateBusinessInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
