import { Field, ID, Int, ObjectType, Float } from '@nestjs/graphql';

/** GraphQL ObjectType for DataSheet */
@ObjectType()
export class DataSheetType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  businessId: string;

  @Field(() => ID)
  uploadedBy: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  originalFilename: string | null;

  @Field()
  periodType: string;

  @Field(() => [String])
  periodHeaders: string[];

  @Field(() => Int)
  seriesCount: number;

  @Field(() => Int)
  periodCount: number;

  @Field({ nullable: true })
  fileUrl: string | null;

  @Field()
  status: string;

  @Field({ nullable: true })
  errorMessage: string | null;

  @Field({ nullable: true })
  importedAt: Date | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/** GraphQL ObjectType for DataSeries */
@ObjectType()
export class DataSeriesType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  dataSheetId: string;

  @Field()
  seriesName: string;

  @Field(() => Int)
  rowIndex: number;
}

/** GraphQL ObjectType for import progress subscription */
@ObjectType()
export class ImportProgressType {
  @Field(() => ID)
  datasheetId: string;

  @Field(() => Float)
  percent: number;

  @Field()
  status: string;

  @Field({ nullable: true })
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
