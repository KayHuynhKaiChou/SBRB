import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

/** REST user endpoints — /api/v1/users/* */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.userService.findById(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: JwtPayload) {
    await this.userService.deleteAccount(user.sub);
  }

  @Get('me/sessions')
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.userService.getSessions(user.sub);
  }

  @Delete('me/sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.userService.deleteSession(user.sub, id);
  }
}
