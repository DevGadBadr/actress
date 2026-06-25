export class AgentDataEntity {
  id!: number;
  created_at!: string;
  actress_name!: string | null;
  actress_pic_url!: string | null;
  favourite!: boolean;
}

export class PaginatedAgentData {
  data!: AgentDataEntity[];
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
}
