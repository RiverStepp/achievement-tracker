import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  ConversationDto,
  ConversationMessageHistoryDto,
  MessageDto,
} from "@/types/messages";
 
export const dmService = {
  getConversations: async (): Promise<ConversationDto[]> => {
    const response = await api.get<ConversationDto[]>(endpoints.dm.conversations);
    return response.data;
  },
 
  getMessages: async (
    conversationId: number,
    pageSize = 50,
    before?: number
  ): Promise<ConversationMessageHistoryDto> => {
    const params: Record<string, unknown> = { pageSize };
    if (before !== undefined) params.before = before;
    const response = await api.get<ConversationMessageHistoryDto>(
      endpoints.dm.messages(conversationId),
      { params }
    );
    return response.data;
  },
 
  sendMessage: async (recipientPublicId: string, content: string): Promise<MessageDto> => {
    const response = await api.post<MessageDto>(endpoints.dm.send, {
      recipientPublicId,
      content,
    });
    return response.data;
  },
 
  markAsRead: async (conversationId: number): Promise<void> => {
    await api.post(endpoints.dm.markRead(conversationId));
  },
} as const;
