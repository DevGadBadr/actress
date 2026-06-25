import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AgentDataService } from './agent-data.service';
import { QueryAgentDataDto } from './dto/query-agent-data.dto';

@Controller('agent-data')
export class AgentDataController {
  constructor(private readonly agentDataService: AgentDataService) {}

  @Get()
  findAll(@Query() query: QueryAgentDataDto) {
    return this.agentDataService.findAll(
      query.page ?? 1,
      query.limit ?? 10,
      query.shuffle ?? false,
    );
  }

  @Patch(':id/favourite')
  toggleFavourite(@Param('id', ParseIntPipe) id: number) {
    return this.agentDataService.toggleFavourite(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agentDataService.remove(id);
  }
}
