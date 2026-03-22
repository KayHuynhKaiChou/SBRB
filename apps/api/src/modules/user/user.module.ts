import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Session } from '../auth/entities/session.entity';
import { User } from '../auth/entities/user.entity';
import { UserController } from './user.controller';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

/** User module — profile management, sessions */
@Module({
  imports: [TypeOrmModule.forFeature([User, Session, RefreshToken])],
  providers: [UserService, UserResolver],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
