export type AgentData = {
  id: number;
  created_at: string;
  actress_name: string | null;
  actress_pic_url: string | null;
  favourite: boolean;
};

export type PaginatedAgentData = {
  data: AgentData[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
