import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { useChatHub } from "@/hooks/useChathub";
import { dmService } from "@/services/messages";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { MessageInput } from "@/components/messages/MessageInput";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
    ConversationDto,
    ConversationParticipantDto,
    MessageDto,
} from "@/types/messages";
import { Loader2, MessageSquare } from "lucide-react";
 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

type UserSearchResult = {
    publicId: string;
    handle: string;
    displayName: string | null;
    profileImageUrl: string | null;
};

function shortId(publicId: string) {
    return publicId.slice(0, 8);
}

function getDisplayName(participant: ConversationParticipantDto) {
    return participant.displayName || participant.handle || shortId(participant.publicId);
}

function getProfilePath(participant: ConversationParticipantDto | null) {
    if (!participant) return null;
    return `/u/${participant.handle || participant.publicId}`;
}

function getParticipantFallback(publicId: string): ConversationParticipantDto {
    return {
        publicId,
        handle: null,
        displayName: null,
        profileImageUrl: null,
    };
}

function getOtherParticipant(
    conversation: ConversationDto | null,
    currentUserPublicId: string | null
): ConversationParticipantDto | null {
    if (!conversation) return null;

    const participants =
        conversation.participants?.length
            ? conversation.participants
            : conversation.participantPublicIds.map(getParticipantFallback);

    if (!currentUserPublicId) return participants[0] ?? null;

    return (
        participants.find(
            (participant) =>
                participant.publicId.toLowerCase() !== currentUserPublicId.toLowerCase()
        ) ??
        participants[0] ??
        null
    );
}

function mergeParticipantIntoConversation(
    conversation: ConversationDto,
    participant: ConversationParticipantDto
): ConversationDto {
    const participants = conversation.participants?.length
        ? conversation.participants
        : conversation.participantPublicIds.map(getParticipantFallback);
    const existingIndex = participants.findIndex(
        (item) => item.publicId.toLowerCase() === participant.publicId.toLowerCase()
    );

    if (existingIndex === -1) {
        return { ...conversation, participants: [...participants, participant] };
    }

    const nextParticipants = [...participants];
    nextParticipants[existingIndex] = {
        ...nextParticipants[existingIndex],
        ...participant,
    };

    return { ...conversation, participants: nextParticipants };
}
 
export const MessagesPage = () => {
    const { userProfile, appUser } = useAuth();
    const currentUserPublicId = appUser?.publicId ?? userProfile?.user.publicId ?? null;
 
    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<ConversationDto | null>(null);
    const [newConvOpen, setNewConvOpen] = useState(false);
    const [latestIncoming, setLatestIncoming] = useState<MessageDto | null>(null);
    const selectedConvRef = useRef<ConversationDto | null>(null);
    selectedConvRef.current = selectedConversation;
 
    const fetchConversations = useCallback(async () => {
        try {
            const data = await dmService.getConversations();
            data.sort((a, b) => {
                const aDate = a.lastMessage?.sentDate ?? a.createDate;
                const bDate = b.lastMessage?.sentDate ?? b.createDate;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            setConversations(data);
            return data;
        } catch {
            return [];
        }
    }, []);
 
    useEffect(() => {
        setLoading(true);
        fetchConversations().finally(() => setLoading(false));
    }, [fetchConversations]);
 
    const handleReceiveMessage = useCallback((message: MessageDto) => {
        setConversations((prev) => {
            const existing = prev.find((c) => c.conversationId === message.conversationId);
            if (!existing) {
                void fetchConversations();
                return prev;
            }
 
            const isCurrentConv =
                selectedConvRef.current?.conversationId === message.conversationId;
            const isOwnMessage =
                message.senderPublicId.toLowerCase() === currentUserPublicId?.toLowerCase();
 
            const updated: ConversationDto = {
                ...existing,
                lastMessage: message,
                unreadCount: isCurrentConv || isOwnMessage
                    ? existing.unreadCount
                    : existing.unreadCount + 1,
            };
 
            return [
                updated,
                ...prev.filter((c) => c.conversationId !== message.conversationId),
            ];
        });
 
        setLatestIncoming(message);
    }, [currentUserPublicId, fetchConversations]);
 
    const handleMessagesRead = useCallback((conversationId: number) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
    }, []);
 
    const { sendMessage, markAsRead, isConnected } = useChatHub(API_BASE_URL, {
        onReceiveMessage: handleReceiveMessage,
        onMessagesRead: handleMessagesRead,
    });
 
    const handleSelectConversation = useCallback((conv: ConversationDto) => {
        setSelectedConversation(conv);
        setConversations((prev) =>
            prev.map((c) =>
                c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
    }, []);
 
    const handleMarkRead = useCallback(
        async (conversationId: number) => {
            if (isConnected()) {
                await markAsRead(conversationId);
            } else {
                await dmService.markAsRead(conversationId).catch(() => {});
            }
            setConversations((prev) =>
                prev.map((c) =>
                    c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
                )
            );
        },
        [isConnected, markAsRead]
    );
 
    const handleSend = useCallback(
        async (content: string) => {
            if (!selectedConversation) return;
 
            const otherPublicId = selectedConversation.participantPublicIds.find(
                (id) => id.toLowerCase() !== currentUserPublicId?.toLowerCase()
            );
            if (!otherPublicId) return;
 
            if (isConnected()) {
                await sendMessage(otherPublicId, content);
            } else {
                const msg = await dmService.sendMessage(otherPublicId, content);
                handleReceiveMessage(msg);
            }
        },
        [selectedConversation, currentUserPublicId, isConnected, sendMessage, handleReceiveMessage]
    );
 
    const handleNewConversationSend = useCallback(
        async (recipientPublicId: string, content: string, recipient: UserSearchResult) => {
            const recipientParticipant: ConversationParticipantDto = {
                publicId: recipient.publicId,
                handle: recipient.handle,
                displayName: recipient.displayName,
                profileImageUrl: recipient.profileImageUrl,
            };

            if (isConnected()) {
                await sendMessage(recipientPublicId, content);
                const data = await fetchConversations();
                const newConv = data.find((c) =>
                    c.participantPublicIds.some(
                        (id) => id.toLowerCase() === recipientPublicId.toLowerCase()
                    )
                );
                if (newConv) {
                    const hydrated = mergeParticipantIntoConversation(
                        newConv,
                        recipientParticipant
                    );
                    setSelectedConversation(hydrated);
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.conversationId === hydrated.conversationId ? hydrated : c
                        )
                    );
                }
            } else {
                const msg = await dmService.sendMessage(recipientPublicId, content);
                const data = await fetchConversations();
                const newConv = data.find(
                    (c) => c.conversationId === msg.conversationId
                );
                if (newConv) {
                    const hydrated = mergeParticipantIntoConversation(
                        newConv,
                        recipientParticipant
                    );
                    setSelectedConversation(hydrated);
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.conversationId === hydrated.conversationId ? hydrated : c
                        )
                    );
                }
            }
        },
        [isConnected, sendMessage, fetchConversations]
    );
 
    const otherParticipant = getOtherParticipant(selectedConversation, currentUserPublicId);
    const otherParticipantName = otherParticipant ? getDisplayName(otherParticipant) : null;
    const otherParticipantProfilePath = getProfilePath(otherParticipant);
 
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-app-panel rounded-lg shadow-md shadow-app-border">
                <Loader2 className="h-6 w-6 animate-spin text-app-muted" />
            </div>
        );
    }
 
    return (
        <div className="h-full flex bg-app-panel rounded-lg shadow-md shadow-app-border overflow-hidden">
            {/* Conversation list sidebar */}
            <div className="w-72 shrink-0 border-r border-app-border flex flex-col min-h-0">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.conversationId ?? null}
                    currentUserPublicId={currentUserPublicId}
                    onSelect={handleSelectConversation}
                    onNewConversation={() => setNewConvOpen(true)}
                />
            </div>
 
            {/* Message thread area */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {selectedConversation ? (
                    <>
                        {/* Thread header */}
                        <div className="shrink-0 px-4 py-3 border-b border-app-border flex items-center gap-3">
                            {otherParticipantProfilePath ? (
                                <Link
                                    to={otherParticipantProfilePath}
                                    className="shrink-0 transition-transform hover:scale-[1.02]"
                                    aria-label={`Open ${otherParticipantName ?? "user"}'s profile`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={otherParticipant?.profileImageUrl ?? undefined}
                                            alt={`${otherParticipantName ?? "User"} avatar`}
                                        />
                                        <AvatarFallback className="bg-app-border text-app-muted uppercase">
                                            {otherParticipantName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                            ) : null}
                            {otherParticipantProfilePath ? (
                                <Link
                                    to={otherParticipantProfilePath}
                                    className="app-heading text-sm truncate hover:underline"
                                >
                                    {otherParticipantName}
                                </Link>
                            ) : (
                                <span className="app-heading text-sm truncate">
                                    {otherParticipantName}
                                </span>
                            )}
                        </div>
 
                        {/* Messages */}
                        <MessageThread
                            conversation={selectedConversation}
                            currentUserPublicId={currentUserPublicId}
                            incomingMessage={latestIncoming}
                            onMarkRead={handleMarkRead}
                        />
 
                        {/* Input */}
                        <MessageInput onSend={handleSend} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-app-muted">
                        <MessageSquare className="h-10 w-10 opacity-30" />
                        <p className="text-sm">Select a conversation or start a new one.</p>
                    </div>
                )}
            </div>
 
            <NewConversationDialog
                open={newConvOpen}
                onClose={() => setNewConvOpen(false)}
                onSend={handleNewConversationSend}
            />
        </div>
    );
};
