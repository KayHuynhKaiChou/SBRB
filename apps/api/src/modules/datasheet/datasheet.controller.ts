import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { DatasheetExportService } from './datasheet-export.service';
import { DatasheetService } from './datasheet.service';
import { ImportFilterDto } from './dto/import-filter.dto';
import { UpdateDatasheetDto } from './dto/update-datasheet.dto';

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

/** DataSheet REST controller — SRS 4.7 / 4.8 */
@Controller()
@UseGuards(JwtAuthGuard)
export class DatasheetController {
  constructor(
    private readonly datasheetService: DatasheetService,
    private readonly exportService: DatasheetExportService,
  ) {}

  /** POST /businesses/:businessId/data-sheets/upload */
  @Post('businesses/:businessId/data-sheets/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: FILE_SIZE_LIMIT } }))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('departmentId') departmentId: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.upload(file, businessId, user.sub, departmentId);
  }

  /** GET /businesses/:businessId/data-sheets */
  @Get('businesses/:businessId/data-sheets')
  async findByBusiness(
    @Param('businessId') businessId: string,
    @Query('departmentId') departmentId: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.findByBusiness(businessId, user.sub, departmentId);
  }

  /** GET /data-sheets/export-template — MUST be before /:id */
  @Get('data-sheets/export-template')
  async exportTemplate(@Query() query: ImportFilterDto, @Res() res: Response) {
    const periodType = query.periodType ?? 'month';
    const count = query.count ?? 3;
    const buffer = await this.datasheetService.generateTemplate(periodType, count);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=sbrb_template_${periodType}_${date}.xlsx`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  /** POST /data-sheets/preview — MUST be before /:id routes to avoid route shadowing */
  @Post('data-sheets/preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: FILE_SIZE_LIMIT } }))
  async previewFile(@UploadedFile() file: Express.Multer.File) {
    return this.datasheetService.preview(file);
  }

  /** GET /data-sheets/:id/export — MUST be before /:id to avoid route shadowing */
  @Get('data-sheets/:id/export')
  async exportExcel(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.user as IJwtPayload;
    const { buffer, fileName } = await this.exportService.exportToExcel(id, user.sub);
    const encodedName = encodeURIComponent(fileName);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedName}`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  /** GET /data-sheets/:id */
  @Get('data-sheets/:id')
  async findById(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.findById(id, user.sub);
  }

  /** GET /data-sheets/:id/series */
  @Get('data-sheets/:id/series')
  async findSeries(
    @Param('id') id: string,
    @Query('search') search: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.findSeries(id, user.sub, search);
  }

  /** PATCH /data-sheets/:id */
  @Patch('data-sheets/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDatasheetDto,
    @Req() req: Request,
  ) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.update(id, user.sub, body.name, body.departmentId);
  }

  /** DELETE /data-sheets/:id */
  @Delete('data-sheets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    await this.datasheetService.delete(id, user.sub);
  }

  /** POST /data-sheets/:id/reimport */
  @Post('data-sheets/:id/reimport')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: FILE_SIZE_LIMIT } }))
  @HttpCode(HttpStatus.CREATED)
  async reimport(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.reimport(id, file, user.sub);
  }

  /** GET /businesses/:businessId/import-history */
  @Get('businesses/:businessId/import-history')
  async getImportHistory(@Param('businessId') businessId: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.getImportHistory(businessId, user.sub);
  }

  /** GET /import-history/:batchId */
  @Get('import-history/:batchId')
  async getImportBatch(@Param('batchId') batchId: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.datasheetService.getImportBatch(batchId, user.sub);
  }
}
