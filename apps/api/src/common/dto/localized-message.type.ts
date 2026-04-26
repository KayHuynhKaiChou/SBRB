import { Field, ObjectType, InputType } from '@nestjs/graphql';
import type { ILocalizedMessage } from '@sbrb/shared-types';

/** GraphQL ObjectType mirror of ILocalizedMessage (BE→FE response). */
@ObjectType('LocalizedMessage')
export class LocalizedMessage implements ILocalizedMessage {
  @Field()
  vi: string;

  @Field()
  en: string;
}

/** GraphQL InputType mirror of ILocalizedMessage (FE→BE input, rare use). */
@InputType('LocalizedMessageInput')
export class LocalizedMessageInput implements ILocalizedMessage {
  @Field()
  vi: string;

  @Field()
  en: string;
}
