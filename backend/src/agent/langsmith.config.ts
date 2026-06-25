import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Ensures LangSmith env vars are set for the SDK (same names as backend/ai/.env).
 * ConfigModule loads backend/.env into process.env on startup.
 */
@Injectable()
export class LangSmithConfigService implements OnModuleInit {
  private readonly logger = new Logger(LangSmithConfigService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const tracing = this.config.get<string>('LANGSMITH_TRACING');
    const apiKey = this.config.get<string>('LANGSMITH_API_KEY');
    const project = this.config.get<string>('LANGSMITH_PROJECT');

    if (tracing === 'true' && apiKey) {
      process.env.LANGSMITH_TRACING = 'true';
      process.env.LANGSMITH_API_KEY = apiKey;
      if (project) {
        process.env.LANGSMITH_PROJECT = project;
      }
      this.logger.log(
        `LangSmith tracing enabled${project ? ` (project: ${project})` : ''}`,
      );
      return;
    }

    this.logger.warn(
      'LangSmith tracing disabled — set LANGSMITH_TRACING=true and LANGSMITH_API_KEY in backend/.env',
    );
  }
}
