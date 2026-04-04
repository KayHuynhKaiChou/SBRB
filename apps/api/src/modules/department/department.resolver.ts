import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DepartmentService } from './department.service';
import { DepartmentType } from './dto/department.type';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Resolver(() => DepartmentType)
@UseGuards(JwtAuthGuard)
export class DepartmentResolver {
  constructor(private readonly departmentService: DepartmentService) {}

  @Query(() => [DepartmentType], { name: 'departments' })
  async getDepartments(
    @Args('businessId', { type: () => ID }) businessId: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType[]> {
    return this.departmentService.findByBusiness(businessId, user.sub);
  }

  @Mutation(() => DepartmentType)
  async createDepartment(
    @Args('input') input: CreateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType> {
    return this.departmentService.create(user.sub, input);
  }

  @Mutation(() => DepartmentType)
  async updateDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDepartmentDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<DepartmentType> {
    return this.departmentService.update(id, user.sub, input);
  }

  @Mutation(() => Boolean)
  async deleteDepartment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: IJwtPayload,
  ): Promise<boolean> {
    await this.departmentService.delete(id, user.sub);
    return true;
  }
}
