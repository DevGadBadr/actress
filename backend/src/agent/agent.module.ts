import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentToolsService } from './agent-tools.service';
import { LangSmithConfigService } from './langsmith.config';

@Module({
  controllers: [AgentController],
  providers: [
    LangSmithConfigService,
    AgentService,
    AgentToolsService,
  ],
})
export class AgentModule {}
