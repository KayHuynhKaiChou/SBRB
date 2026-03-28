import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMember } from '../modules/business/entities/business-member.entity';
import { AuthorizationService } from './services/authorization.service';

/**
 * CommonModule — provides shared services (AuthorizationService, etc.)
 * Import this module in any feature module that needs shared authorization.
 */
@Module({
  imports: [TypeOrmModule.forFeature([BusinessMember])],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class CommonModule {}
