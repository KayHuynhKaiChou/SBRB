import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { IApiResponse } from '@sbrb/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { created, ok } from '../../common/utils/api-response.util';
import { IJwtPayload } from '../auth/jwt.strategy';
import { UserType } from '../auth/dto/user.type';
import { DepartmentMemberService } from './department-member.service';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentMemberType } from './dto/department-member.type';
import { DepartmentPositionInput, DepartmentType } from './dto/department.type';
import {
  DepartmentListResponse,
  DepartmentMemberResponse,
  DepartmentMemberListResponse,
  DepartmentResponse,
  MemberInfoResponse,
} from './dto/department-response.type';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateMemberInfoDto } from './dto/update-member-info.dto';

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

  /** Members of this department + all sub-departments, each tagged with its real department + isDirect. */
  @Query(() => [DepartmentMemberType], { name: 'departmentSubtreeMembers' })
  getDepartmentSubtreeMembers(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentMemberType[]> {
    return this.memberService.findSubtreeMembers(departmentId, user.sub) as unknown as Promise<
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

  /** Add or TRANSFER multiple users into a department (one department per employee). */
  @Mutation(() => DepartmentMemberListResponse)
  async addDepartmentMembers(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('userIds', { type: () => [ID] }) userIds: string[],
    @CurrentUser() actor: IJwtPayload,
  ): Promise<IApiResponse<DepartmentMemberType[]>> {
    const members = (await this.memberService.addMembers(
      departmentId,
      userIds,
      actor.sub,
    )) as unknown as DepartmentMemberType[];
    return ok(members, { vi: 'Đã thêm/chuyển thành viên', en: 'Members added' });
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

  @Mutation(() => MemberInfoResponse)
  async updateMemberInfo(
    @Args('businessId', { type: () => ID }) businessId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('input') input: UpdateMemberInfoDto,
    @CurrentUser() actor: IJwtPayload,
  ): Promise<IApiResponse<UserType>> {
    const updatedUser = (await this.memberService.updateMemberInfo(
      businessId,
      userId,
      input,
      actor.sub,
    )) as unknown as UserType;
    return ok(updatedUser, { vi: 'Đã cập nhật thông tin thành viên', en: 'Member info updated' });
  }
}
