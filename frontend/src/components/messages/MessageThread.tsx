import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dmService } from "@/services/messages";
import type { ConversationDto, MessageDto } from "@/types/messages";
 
type Props = {
  conversation: ConversationDto;
  currentUserPublicId: string | null;
  incomingMessage: MessageDto | null;
  onMarkRead: (conversationId: number) => void;
};
 
function formatMessageTime(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
 
function formatDateSeparator(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
 
  if (isToday) return "Today";
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
 
function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
 
function shortId(publicId: string) {
  return publicId.slice(0, 8);
}
 
export function MessageThread({
  conversation,
  currentUserPublicId,
  incomingMessage,
  onMarkRead,
}: Props) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestId, setOldestId] = useState<number | undefined>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeight = useRef(0);
 
  const loadMessages = useCallback(
    async (conversationId: number, before?: number) => {
      const data = await dmService.getMessages(conversationId, 50, before);
      return data;
    },
    []
  );
 
  useEffect(() => {
    setMessages([]);
    setOldestId(undefined);
    setHasMore(false);
    setLoading(true);
 
    loadMessages(conversation.conversationId).then((data) => {
      const sorted = [...data.messages].sort(
        (a, b) => a.directMessageId - b.directMessageId
      );
      setMessages(sorted);
      setHasMore(data.messages.length === 50);
      if (sorted.length > 0) setOldestId(sorted[0].directMessageId);
      setLoading(false);
    });
  }, [conversation.conversationId, loadMessages]);
 
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      onMarkRead(conversation.conversationId);
    }
  }, [loading, conversation.conversationId, onMarkRead]);
 
  useEffect(() => {
    if (!incomingMessage) return;
    if (incomingMessage.conversationId !== conversation.conversationId) return;
 
    setMessages((prev) => {
      const exists = prev.some(
        (m) => m.directMessageId === incomingMessage.directMessageId
      );
      if (exists) return prev;
      return [...prev, incomingMessage];
    });
 
    const isOwnMessage =
      incomingMessage.senderPublicId.toLowerCase() ===
      currentUserPublicId?.toLowerCase();
 
    if (!isOwnMessage) {
      onMarkRead(conversation.conversationId);
    }
 
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [incomingMessage, conversation.conversationId, currentUserPublicId, onMarkRead]);
 
  const loadMore = async () => {
    if (!hasMore || loadingMore || !oldestId) return;
    setLoadingMore(true);
    prevScrollHeight.current = containerRef.current?.scrollHeight ?? 0;
 
    const data = await dmService.getMessages(
      conversation.conversationId,
      50,
      oldestId
    );
    const sorted = [...data.messages].sort(
      (a, b) => a.directMessageId - b.directMessageId
    );
 
    setMessages((prev) => [...sorted, ...prev]);
    setHasMore(data.messages.length === 50);
    if (sorted.length > 0) setOldestId(sorted[0].directMessageId);
    setLoadingMore(false);
 
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      }
    });
  };
 
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-app-muted" />
      </div>
    );
  }
 
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto app-scrollbar px-4 py-2">
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
            className="text-app-muted text-xs gap-1"
          >
            {loadingMore ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
            Load earlier messages
          </Button>
        </div>
      )}
 
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-app-muted">No messages yet. Say hello!</p>
        </div>
      )}
 
      {messages.map((msg, i) => {
        const isOwn =
          msg.senderPublicId.toLowerCase() === currentUserPublicId?.toLowerCase();
        const prev = messages[i - 1];
        const showDateSep = !prev || !isSameDay(prev.sentDate, msg.sentDate);
 
        return (
          <div key={msg.directMessageId}>
            {showDateSep && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-app-border" />
                <span className="text-xs text-app-muted shrink-0">
                  {formatDateSeparator(msg.sentDate)}
                </span>
                <div className="flex-1 h-px bg-app-border" />
              </div>
            )}
            <div
              className={`flex mb-1 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {!isOwn && (
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-app-border flex items-center justify-center text-xs font-semibold text-app-muted uppercase mr-2 mt-1">
                  {shortId(msg.senderPublicId).charAt(0)}
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  isOwn
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-app-border text-app-text rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-[10px] mt-0.5 text-right ${
                    isOwn ? "text-blue-200" : "text-app-muted"
                  }`}
                >
                  {formatMessageTime(msg.sentDate)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
