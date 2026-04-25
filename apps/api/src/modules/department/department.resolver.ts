import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DepartmentMemberService } from './department-member.service';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentMemberType } from './dto/department-member.type';
import { DepartmentPositionInput, DepartmentType } from './dto/department.type';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Resolver(() => DepartmentType)
@UseGuards(JwtAuthGuard)
export class DepartmentResolver {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly memberService: DepartmentMemberService,
  ) {}

  @Query(() => [DepartmentType], { name: 'departments' })
  getDepartments(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType[]> {
    return this.departmentService.findByBusiness(businessId, user.sub) as Promise<
      DepartmentType[]
    >;
  }

  @Query(() => [DepartmentType], { name: 'departmentTree' })
  getDepartmentTree(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType[]> {
    return this.departmentService.findTree(businessId, user.sub);
  }

  @Query(() => [DepartmentMemberType], { name: 'departmentMembers' })
  getDepartmentMembers(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentMemberType[]> {
    return this.memberService.findMembers(departmentId, user.sub) as unknown as Promise<
      DepartmentMemberType[]
    >;
  }

  @Mutation(() => DepartmentType)
  createDepartment(
    @Args('input') input: CreateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType> {
    return this.departmentService.create(user.sub, input) as Promise<DepartmentType>;
  }

  @Mutation(() => DepartmentType)
  updateDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType> {
    return this.departmentService.update(id, user.sub, input) as Promise<DepartmentType>;
  }

  @Mutation(() => Boolean)
  async deleteDepartment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.departmentService.delete(id, user.sub);
    return true;
  }

  @Mutation(() => DepartmentMemberType)
  addDepartmentMember(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<DepartmentMemberType> {
    return this.memberService.addMember(departmentId, userId, actor.sub) as unknown as Promise<
      DepartmentMemberType
    >;
  }

  @Mutation(() => Boolean)
  async removeDepartmentMember(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<boolean> {
    await this.memberService.removeMember(departmentId, userId, actor.sub);
    return true;
  }

  @Query(() => String, { name: 'myBusinessRole', nullable: true })
  getMyBusinessRole(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<string | null> {
    return this.departmentService.findMyRole(businessId, user.sub);
  }

  @Mutation(() => [DepartmentType])
  updateDepartmentPositions(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('positions', { type: () => [DepartmentPositionInput] })
    positions: DepartmentPositionInput[],
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType[]> {
    return this.departmentService.updatePositions(
      businessId,
      user.sub,
      positions,
    ) as Promise<DepartmentType[]>;
  }

  @Mutation(() => DepartmentMemberType)
  setDepartmentManager(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<DepartmentMemberType> {
    return this.memberService.setManager(departmentId, userId, actor.sub) as unknown as Promise<
      DepartmentMemberType
    >;
  }
}
