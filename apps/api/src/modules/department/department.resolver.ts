import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { created, ok } from '../../common/utils/api-response.util';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DepartmentMemberService } from './department-member.service';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentMemberType } from './dto/department-member.type';
import { DepartmentPositionInput, DepartmentType } from './dto/department.type';
import {
  DepartmentListResponse,
  DepartmentMemberResponse,
  DepartmentResponse,
} from './dto/department-response.type';
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

  @Mutation(() => DepartmentResponse)
  async createDepartment(
    @Args('input') input: CreateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<DepartmentType>> {
    const dept = (await this.departmentService.create(user.sub, input)) as DepartmentType;
    return created(dept, { vi: 'Đã tạo Phòng ban', en: 'Department created' });
  }

  @Mutation(() => DepartmentResponse)
  async updateDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<DepartmentType>> {
    const dept = (await this.departmentService.update(id, user.sub, input)) as DepartmentType;
    return ok(dept, { vi: 'Đã cập nhật Phòng ban', en: 'Department updated' });
  }

  @Mutation(() => DepartmentResponse)
  async deleteDepartment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<DepartmentType>> {
    const snapshot = await this.departmentService.delete(id, user.sub);
    return ok(snapshot, { vi: 'Đã xoá Phòng ban', en: 'Department deleted' });
  }

  @Mutation(() => DepartmentMemberResponse)
  async addDepartmentMember(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<IApiResponse<DepartmentMemberType>> {
    const member = (await this.memberService.addMember(
      departmentId,
      userId,
      actor.sub,
    )) as unknown as DepartmentMemberType;
    return created(member, { vi: 'Đã thêm thành viên', en: 'Member added' });
  }

  @Mutation(() => DepartmentMemberResponse)
  async removeDepartmentMember(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<IApiResponse<DepartmentMemberType>> {
    const snapshot = await this.memberService.removeMember(departmentId, userId, actor.sub);
    return ok(snapshot, { vi: 'Đã xoá thành viên', en: 'Member removed' });
  }

  @Query(() => String, { name: 'myBusinessRole', nullable: true })
  getMyBusinessRole(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<string | null> {
    return this.departmentService.findMyRole(businessId, user.sub);
  }

  @Mutation(() => DepartmentListResponse)
  async updateDepartmentPositions(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('positions', { type: () => [DepartmentPositionInput] })
    positions: DepartmentPositionInput[],
    @CurrentUser() user: IJwtPayload,
  ): Promise<IApiResponse<DepartmentType[]>> {
    const items = (await this.departmentService.updatePositions(
      businessId,
      user.sub,
      positions,
    )) as DepartmentType[];
    return ok(items, { vi: 'Đã cập nhật vị trí Phòng ban', en: 'Department positions updated' });
  }

  @Mutation(() => DepartmentMemberResponse)
  async setDepartmentManager(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<IApiResponse<DepartmentMemberType>> {
    const member = (await this.memberService.setManager(
      departmentId,
      userId,
      actor.sub,
    )) as unknown as DepartmentMemberType;
    return ok(member, { vi: 'Đã đặt Trưởng phòng', en: 'Manager assigned' });
  }
}
