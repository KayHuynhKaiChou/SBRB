import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';
import { UpdateDataLinkDto } from './dto/update-data-link.dto';
import { UpdateWidgetPositionDto } from './dto/update-widget-position.dto';
import { WidgetDataService } from './widget-data.service';
import { WidgetService } from './widget.service';

/** REST controller for high-frequency position updates + chart/data-link ops — SRS 4.4.3 / 4.5 */
@Controller()
@UseGuards(JwtAuthGuard)
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly widgetDataService: WidgetDataService,
  ) {}

  /** PATCH /api/v1/widgets/:id/position — debounced 300ms on client */
  @Patch('widgets/:id/position')
  updatePosition(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateWidgetPositionDto,
  ) {
    const user = req.user as IJwtPayload;
    return this.widgetService.updatePosition(id, user.sub, dto);
  }

  /** GET /api/v1/widgets/:id/chart-data */
  @Get('widgets/:id/chart-data')
  getChartData(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.widgetDataService.getChartData(id, user.sub);
  }

  /** PATCH /api/v1/widgets/:id/config */
  @Patch('widgets/:id/config')
  updateConfig(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateWidgetConfigDto) {
    const user = req.user as IJwtPayload;
    return this.widgetDataService.updateConfig(id, user.sub, dto.config);
  }

  /** PATCH /api/v1/widgets/:id/data-link */
  @Patch('widgets/:id/data-link')
  updateDataLink(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateDataLinkDto) {
    const user = req.user as IJwtPayload;
    return this.widgetDataService.updateDataLink(id, user.sub, dto);
  }

  /** DELETE /api/v1/widgets/:id/data-link */
  @Delete('widgets/:id/data-link')
  removeDataLink(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as IJwtPayload;
    return this.widgetDataService.removeDataLink(id, user.sub);
  }
}
