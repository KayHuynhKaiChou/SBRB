import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IJwtPayload } from '../auth/jwt.strategy';
import { UpdateWidgetPositionDto } from './dto/update-widget-position.dto';
import { WidgetService } from './widget.service';

/** REST controller for high-frequency position updates — SRS 4.4.3 */
@Controller()
@UseGuards(JwtAuthGuard)
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

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
}
