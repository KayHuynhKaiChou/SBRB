import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { MinioService } from '../minio/minio.service';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

/** REST controller for Business — SRS 4.2 */
@Controller()
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly minioService: MinioService,
  ) {}

  @Post('businesses')
  create(@Req() req: Request, @Body() dto: CreateBusinessDto) {
    const user = req.user as IJwtPayload;
    return this.businessService.create(user.sub, dto);
  }

  @Get('users/me/businesses')
  findMyBusinesses(@Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.businessService.findMyBusinesses(user.sub);
  }

  @Get('businesses/:id')
  findById(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.businessService.findById(id, user.sub);
  }

  @Patch('businesses/:id')
  update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateBusinessDto,
  ) {
    const user = req.user as IJwtPayload;
    return this.businessService.update(id, user.sub, dto);
  }

  @Delete('businesses/:id')
  delete(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('confirmName') confirmName: string,
  ) {
    const user = req.user as IJwtPayload;
    return this.businessService.delete(id, user.sub, confirmName);
  }

  @Post('businesses/:id/transfer-ownership')
  transferOwnership(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('newOwnerId') newOwnerId: string,
  ) {
    const user = req.user as IJwtPayload;
    return this.businessService.transferOwnership(id, user.sub, newOwnerId);
  }

  @Post('businesses/:id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    const user = req.user as IJwtPayload;
    // Verify membership before upload
    await this.businessService.findById(id, user.sub);
    const url = await this.minioService.uploadFile(
      `businesses/${id}/logo`,
      file.buffer,
      file.mimetype,
    );
    return { logoUrl: url };
  }
}
