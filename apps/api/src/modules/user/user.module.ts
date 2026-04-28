import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Session } from '../auth/entities/session.entity';
import { User } from '../auth/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AvatarStorageService } from './services/avatar-storage.service';

/** User module — profile management, sessions, avatar upload */
@Module({
  imports: [TypeOrmModule.forFeature([User, Session, RefreshToken, Department])],
  providers: [UserService, UserResolver, AvatarStorageService],
  controllers: [UserController],
  exports: [UserService, AvatarStorageService],
})
export class UserModule {}
