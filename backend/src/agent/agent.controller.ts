import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  chat(@Body() body: ChatRequestDto) {
    return this.agentService.chat(body.history ?? [], body.message);
  }
}
