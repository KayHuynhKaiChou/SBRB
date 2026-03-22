import { Module } from '@nestjs/common';

/**
 * Business module — SRS 4.2
 * Handles: CRUD business, member management, role assignment,
 * widget assignment for Staff, business switcher data
 */
@Module({
  imports: [],
  // providers: [BusinessService, BusinessResolver, MemberService],
  // controllers: [BusinessController, MemberController],
  // exports: [BusinessService],
})
export class BusinessModule {}
