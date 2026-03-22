import { Injectable } from '@nestjs/common';
import { BusinessCrudService } from './business-crud.service';
import { BusinessOwnershipService } from './business-ownership.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';

/** Facade — delegates to BusinessCrudService and BusinessOwnershipService */
@Injectable()
export class BusinessService {
  constructor(
    private readonly crudService: BusinessCrudService,
    private readonly ownershipService: BusinessOwnershipService,
  ) {}

  create(userId: string, dto: CreateBusinessDto): Promise<Business> {
    return this.crudService.create(userId, dto);
  }

  findById(id: string, userId: string): Promise<Business> {
    return this.crudService.findById(id, userId);
  }

  findMyBusinesses(userId: string): Promise<Business[]> {
    return this.crudService.findMyBusinesses(userId);
  }

  update(id: string, userId: string, dto: UpdateBusinessDto): Promise<Business> {
    return this.crudService.update(id, userId, dto);
  }

  delete(id: string, userId: string, confirmName: string): Promise<void> {
    return this.crudService.delete(id, userId, confirmName);
  }

  transferOwnership(id: string, ownerId: string, newOwnerId: string): Promise<void> {
    return this.ownershipService.transferOwnership(id, ownerId, newOwnerId);
  }
}
