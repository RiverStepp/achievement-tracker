export interface MessageDto {
  directMessageId: number;
  conversationId: number;
  senderPublicId: string;
  content: string;
  sentDate: string;
}
 
export interface ConversationDto {
  conversationId: number;
  participantPublicIds: string[];
  lastMessage: MessageDto | null;
  unreadCount: number;
  createDate: string;
}
 
export interface ConversationMessageHistoryDto {
  messages: MessageDto[];
  lastReadMessageId: number | null;
}
