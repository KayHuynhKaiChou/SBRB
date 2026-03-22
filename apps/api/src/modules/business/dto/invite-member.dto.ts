import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum } from 'class-validator';

/** SRS 4.2.2 — Invite member input */
@InputType()
export class InviteMemberDto {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsEnum(['manager', 'staff', 'viewer'])
  role: 'manager' | 'staff' | 'viewer';
}
