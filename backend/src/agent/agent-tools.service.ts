import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';
import { SupabaseService } from '../supabase/supabase.service';

const TABLE = 'agent_data';
const EMBEDDING_MODEL = 'text-embedding-3-small';

type TavilySearchResult = {
  results?: Array<{ title?: string; url?: string; content?: string }>;
  images?: string[];
};

@Injectable()
export class AgentToolsService {
  private readonly openai: ReturnType<typeof wrapOpenAI<OpenAI>>;
  private readonly tavilyApiKey: string;

  readonly saveActress: (
    actressName: string,
    actressPicUrl: string,
    description: string,
  ) => Promise<string>;

  readonly searchActressKnowledge: (query: string) => Promise<string>;

  readonly webSearch: (query: string) => Promise<string>;

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    const tavilyKey = this.config.get<string>('TAVILY_API_KEY');

    if (!openaiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }
    if (!tavilyKey) {
      throw new Error('Missing TAVILY_API_KEY in environment');
    }

    this.openai = wrapOpenAI(new OpenAI({ apiKey: openaiKey }));
    this.tavilyApiKey = tavilyKey;

    this.saveActress = traceable(
      this.saveActressImpl.bind(this),
      { name: 'save_actress', run_type: 'tool' },
    );
    this.searchActressKnowledge = traceable(
      this.searchActressKnowledgeImpl.bind(this),
      { name: 'search_actress_knowledge', run_type: 'tool' },
    );
    this.webSearch = traceable(
      this.webSearchImpl.bind(this),
      { name: 'web_search', run_type: 'tool' },
    );
  }

  private async saveActressImpl(
    actressName: string,
    actressPicUrl: string,
    description: string,
  ): Promise<string> {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from(TABLE)
      .select('id')
      .eq('actress_name', actressName)
      .maybeSingle();

    if (existing) {
      return `${actressName} already exists in the database.`;
    }

    const embeddingResponse = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: description,
    });
    const embedding = embeddingResponse.data[0]?.embedding;

    const { error } = await client.from(TABLE).insert({
      actress_name: actressName,
      actress_pic_url: actressPicUrl,
      description,
      embedding,
    });

    if (error) {
      throw new Error(`Failed to save actress: ${error.message}`);
    }

    return `Saved ${actressName} to database.`;
  }

  private async searchActressKnowledgeImpl(query: string): Promise<string> {
    const client = this.supabase.getClient();

    const embeddingResponse = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;

    const { data, error } = await client.rpc('match_actress', {
      query_embedding: queryEmbedding,
      match_count: 3,
    });

    if (error) {
      throw new Error(`Knowledge search failed: ${error.message}`);
    }

    return JSON.stringify(data ?? []);
  }

  private async webSearchImpl(query: string): Promise<string> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.tavilyApiKey,
        query,
        max_results: 10,
        include_images: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Tavily search failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as TavilySearchResult;
    const results = (payload.results ?? []).map((item) => ({
      title: item.title,
      url: item.url,
      content: item.content,
    }));
    const images = payload.images ?? [];

    return JSON.stringify({ results, images });
  }
}
