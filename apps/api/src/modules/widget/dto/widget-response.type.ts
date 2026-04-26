import { ObjectType } from '@nestjs/graphql';
import { ApiResponse } from '../../../common/dto';
import { WidgetType } from './widget.type';

/** Shared GraphQL response wrapper for any mutation that returns a Widget. */
@ObjectType()
export class WidgetResponse extends ApiResponse(WidgetType) {}
