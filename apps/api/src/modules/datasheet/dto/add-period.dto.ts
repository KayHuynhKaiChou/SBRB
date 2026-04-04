import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, MaxLength } from 'class-validator';

/** Input type for adding a new period column to a DataSheet — SRS 4.8 */
@InputType()
export class AddPeriodDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  periodName: string;
}
