import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { AgentToolsService } from './agent-tools.service';
import type { ChatMessageDto } from './dto/chat.dto';

const SYSTEM_PROMPT =
  'You are an agent that finds actresses based on a movie or theme. ' +
  'First use search_actress_knowledge to check if a matching actress is already saved. ' +
  'If nothing relevant is found, use the web_search tool to find a new actress and make it new/modern results, a direct image URL, ' +
  'and write a short description, then use save_actress to store her in the database.';

const TOOL_DEFINITIONS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'save_actress',
      description:
        "Save an actress's name, picture URL, and description (with embedding) to the agent_data table.",
      parameters: {
        type: 'object',
        properties: {
          actress_name: { type: 'string' },
          actress_pic_url: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['actress_name', 'actress_pic_url', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_actress_knowledge',
      description:
        'Search existing saved actresses by meaning/theme using the database.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for actress information, including image URLs.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
];

@Injectable()
export class AgentService {
  private readonly openai: ReturnType<typeof wrapOpenAI<OpenAI>>;
  private readonly runAgent: (
    history: ChatMessageDto[],
    message: string,
  ) => Promise<{
    reply: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }>;

  constructor(
    private readonly config: ConfigService,
    private readonly tools: AgentToolsService,
  ) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    this.openai = wrapOpenAI(new OpenAI({ apiKey: openaiKey }));
    this.runAgent = traceable(this.runAgentImpl.bind(this), {
      name: 'actress-agent',
      run_type: 'chain',
    });
  }

  async chat(history: ChatMessageDto[], message: string) {
    return this.runAgent(history, message);
  }

  private async runAgentImpl(history: ChatMessageDto[], message: string) {
    const conversation: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(
        (entry): ChatCompletionMessageParam => ({
          role: entry.role,
          content: entry.content,
        }),
      ),
      { role: 'user', content: message },
    ];

    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i += 1) {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversation,
        tools: TOOL_DEFINITIONS,
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from language model');
      }

      conversation.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls;
      if (!toolCalls?.length) {
        const reply = assistantMessage.content ?? '';
        return {
          reply,
          messages: [
            ...history,
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: reply },
          ],
        };
      }

      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;

        const args = JSON.parse(toolCall.function.arguments) as Record<
          string,
          string
        >;
        const result = await this.runTool(toolCall.function.name, args);

        conversation.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    throw new Error('Agent exceeded maximum tool iterations');
  }

  private async runTool(
    name: string,
    args: Record<string, string>,
  ): Promise<string> {
    switch (name) {
      case 'save_actress':
        return this.tools.saveActress(
          args.actress_name,
          args.actress_pic_url,
          args.description,
        );
      case 'search_actress_knowledge':
        return this.tools.searchActressKnowledge(args.query);
      case 'web_search':
        return this.tools.webSearch(args.query);
      default:
        return `Unknown tool: ${name}`;
    }
  }
}
