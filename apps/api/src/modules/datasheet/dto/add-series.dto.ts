import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, MaxLength } from 'class-validator';

/** Input type for adding a new DataSeries row to a DataSheet — SRS 4.8 */
@InputType()
export class AddSeriesDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
