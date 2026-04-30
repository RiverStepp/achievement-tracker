export interface MessageDto {
  directMessageId: number;
  conversationId: number;
  senderPublicId: string;
  content: string;
  sentDate: string;
}

export interface ConversationParticipantDto {
  publicId: string;
  handle: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
}
 
export interface ConversationDto {
  conversationId: number;
  participantPublicIds: string[];
  participants?: ConversationParticipantDto[];
  lastMessage: MessageDto | null;
  unreadCount: number;
  createDate: string;
}
 
export interface ConversationMessageHistoryDto {
  messages: MessageDto[];
  lastReadMessageId: number | null;
}
