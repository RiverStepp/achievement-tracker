import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { MessageDto } from "@/types/messages";

const HUB_PATH = "/chat";

type ChatHubCallbacks = {
  onReceiveMessage: (message: MessageDto) => void;
  onMessagesRead: (conversationId: number) => void;
};

export function useChatHub(
  apiBaseUrl: string | undefined,
  callbacks: ChatHubCallbacks
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!apiBaseUrl) return;

    const token = sessionStorage.getItem("authToken");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}${HUB_PATH}`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveDirectMessage", (message: MessageDto) => {
      callbacksRef.current.onReceiveMessage(message);
    });

    connection.on("MessagesRead", (conversationId: number) => {
      callbacksRef.current.onMessagesRead(conversationId);
    });

    connectionRef.current = connection;

    connection.start().catch((err) => {
      console.warn("[chat] SignalR connection failed:", err);
    });

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [apiBaseUrl]);

  const sendMessage = useCallback(
    async (recipientPublicId: string, content: string): Promise<void> => {
      const conn = connectionRef.current;
      if (conn?.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("SendDirectMessage", recipientPublicId, content);
      }
    },
    []
  );

  const markAsRead = useCallback(async (conversationId: number): Promise<void> => {
    const conn = connectionRef.current;
    if (conn?.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("MarkAsRead", conversationId);
    }
  }, []);

  const isConnected = useCallback(() => {
    return connectionRef.current?.state === signalR.HubConnectionState.Connected;
  }, []);

  return { sendMessage, markAsRead, isConnected };
}
