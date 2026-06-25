import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AgentDataRow,
  SupabaseService,
} from '../supabase/supabase.service';
import {
  AgentDataEntity,
  PaginatedAgentData,
} from './entities/agent-data.entity';

const TABLE = 'agent_data';

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mapRow(row: AgentDataRow): AgentDataEntity {
  return {
    id: row.id,
    created_at: row.created_at,
    actress_name: row.actress_name,
    actress_pic_url: row.actress_pic_url,
    favourite: row.favourite ?? false,
  };
}

@Injectable()
export class AgentDataService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(
    page: number,
    limit: number,
    shuffle: boolean,
  ): Promise<PaginatedAgentData> {
    const client = this.supabase.getClient();

    const { data, error, count } = await client
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agent_data: ${error.message}`);
    }

    const rows = (data ?? []) as AgentDataRow[];
    const ordered = shuffle ? shuffleArray(rows) : rows;
    const total = count ?? ordered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const slice = ordered.slice(start, start + limit);

    return {
      data: slice.map(mapRow),
      page: safePage,
      limit,
      total,
      totalPages,
    };
  }

  async toggleFavourite(id: number): Promise<AgentDataEntity> {
    const client = this.supabase.getClient();

    const { data: current, error: fetchError } = await client
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      throw new NotFoundException(`Actress with id ${id} not found`);
    }

    const row = current as AgentDataRow;
    const nextFavourite = !(row.favourite ?? false);

    const { data, error } = await client
      .from(TABLE)
      .update({ favourite: nextFavourite })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update favourite: ${error?.message}`);
    }

    return mapRow(data as AgentDataRow);
  }

  async remove(id: number): Promise<void> {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from(TABLE)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }

    if (!data?.length) {
      throw new NotFoundException(`Actress with id ${id} not found`);
    }
  }
}
