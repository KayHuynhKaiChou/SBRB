import { ObjectType } from '@nestjs/graphql';
import { ApiResponse, ApiResponseList } from '../../../common/dto';
import { DepartmentMemberType } from './department-member.type';
import { DepartmentType } from './department.type';

/** Single-Department mutation envelope (create/update/delete). */
@ObjectType()
export class DepartmentResponse extends ApiResponse(DepartmentType) {}

/** Single-DepartmentMember mutation envelope (add/setManager). */
@ObjectType()
export class DepartmentMemberResponse extends ApiResponse(DepartmentMemberType) {}

/** Bulk-update envelope (updateDepartmentPositions). */
@ObjectType()
export class DepartmentListResponse extends ApiResponseList(DepartmentType) {}
