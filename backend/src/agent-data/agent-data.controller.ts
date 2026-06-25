import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new BadRequestException('Missing url query parameter');
    }

    const { buffer, contentType } = await this.agentDataService.proxyImage(url);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);
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
