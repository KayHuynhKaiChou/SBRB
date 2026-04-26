import { ObjectType } from '@nestjs/graphql';
import { ApiResponse } from '../../../common/dto';
import { TabType } from './tab.type';

/** Shared GraphQL response wrapper for any mutation that returns a Tab. */
@ObjectType()
export class TabResponse extends ApiResponse(TabType) {}
