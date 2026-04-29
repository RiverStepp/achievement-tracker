import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversationDto } from "@/types/messages";
 
type Props = {
  conversations: ConversationDto[];
  selectedId: number | null;
  currentUserPublicId: string | null;
  onSelect: (conversation: ConversationDto) => void;
  onNewConversation: () => void;
};
 
function shortId(publicId: string) {
  return publicId.slice(0, 8);
}
 
function formatTime(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
 
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
 
function getOtherParticipant(
  participantPublicIds: string[],
  currentUserPublicId: string | null
): string {
  if (!currentUserPublicId) return participantPublicIds[0] ?? "Unknown";
  const other = participantPublicIds.find(
    (id) => id.toLowerCase() !== currentUserPublicId.toLowerCase()
  );
  return other ?? participantPublicIds[0] ?? "Unknown";
}
 
export function ConversationList({
  conversations,
  selectedId,
  currentUserPublicId,
  onSelect,
  onNewConversation,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-app-border shrink-0">
        <h2 className="app-heading text-base">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          title="New message"
          className="h-8 w-8 text-app-muted hover:text-app-text"
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>
 
      <div className="flex-1 overflow-y-auto app-scrollbar">
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-app-muted">
            No conversations yet.
            <br />
            Start one with the icon above.
          </div>
        ) : (
          conversations.map((conv) => {
            const otherParticipantId = getOtherParticipant(
              conv.participantPublicIds,
              currentUserPublicId
            );
            const isSelected = conv.conversationId === selectedId;
            const hasUnread = conv.unreadCount > 0;
 
            return (
              <button
                key={conv.conversationId}
                type="button"
                onClick={() => onSelect(conv)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-app-border/50 ${
                  isSelected
                    ? "bg-app-bg"
                    : "hover:bg-app-bg/60"
                }`}
              >
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-app-border flex items-center justify-center text-sm font-semibold text-app-muted uppercase">
                  {shortId(otherParticipantId).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm truncate ${
                        hasUnread ? "font-semibold text-app-text" : "text-app-text"
                      }`}
                    >
                      {shortId(otherParticipantId)}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-app-muted shrink-0">
                        {formatTime(conv.lastMessage.sentDate)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        hasUnread ? "text-app-text font-medium" : "text-app-muted"
                      }`}
                    >
                      {conv.lastMessage.senderPublicId.toLowerCase() ===
                      currentUserPublicId?.toLowerCase()
                        ? "You: "
                        : ""}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {hasUnread && (
                  <span className="shrink-0 ml-1 mt-1 h-5 min-w-5 px-1 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
