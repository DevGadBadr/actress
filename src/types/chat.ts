export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatResponse = {
  reply: string;
  messages: ChatMessage[];
};
