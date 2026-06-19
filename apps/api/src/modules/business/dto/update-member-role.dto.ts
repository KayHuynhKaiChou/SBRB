import { Field, InputType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';

/** SRS 4.2.2 — Update member role input */
@InputType()
export class UpdateMemberRoleDto {
  @Field()
  @IsEnum(['manager', 'staff'])
  role: 'manager' | 'staff';
}
