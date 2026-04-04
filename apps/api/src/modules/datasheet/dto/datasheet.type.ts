import { Field, ID, Int, ObjectType, Float } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/** GraphQL ObjectType for DataSheet */
@ObjectType()
export class DataSheetType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  businessId: string;

  @Field(() => ID)
  uploadedBy: string;

  @Field(() => String, { nullable: true })
  departmentId: string | null;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  originalFilename: string | null;

  @Field(() => String)
  periodType: string;

  @Field(() => [String])
  periodHeaders: string[];

  @Field(() => Int)
  seriesCount: number;

  @Field(() => Int)
  periodCount: number;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  errorMessage: string | null;

  @Field(() => Date, { nullable: true })
  importedAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

/** GraphQL ObjectType for DataSeries */
@ObjectType()
export class DataSeriesType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  dataSheetId: string;

  @Field(() => String)
  seriesName: string;

  @Field(() => Int)
  rowIndex: number;

  @Field(() => GraphQLJSON, { nullable: true })
  values: Record<string, number>;
}

/** GraphQL ObjectType for import progress subscription */
@ObjectType()
export class ImportProgressType {
  @Field(() => ID)
  datasheetId: string;

  @Field(() => Float)
  percent: number;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  errorMessage?: string;
}

/** Interfaces for internal use */
export interface IImportJobData {
  batchId: string;
  businessId: string;
  datasheetId: string;
  filePath: string;
  fileName: string;
  uploadedBy: string;
}

export interface IUploadResult {
  batchId: string;
  datasheetId: string;
  status: string;
}
