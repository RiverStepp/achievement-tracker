import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
 
type Props = {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
};
 
export function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
 
  const canSend = text.trim().length > 0 && text.length <= 2000 && !sending && !disabled;
 
  const handleSend = async () => {
    if (!canSend) return;
    const content = text.trim();
    setSending(true);
    try {
      await onSend(content);
      setText("");
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };
 
  return (
    <div className="shrink-0 px-4 py-3 border-t border-app-border">
      <div className="flex items-end gap-2 bg-app-bg rounded-xl border border-app-border px-3 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          maxLength={2000}
          disabled={disabled || sending}
          className="flex-1 bg-transparent text-sm text-app-text placeholder:text-app-muted resize-none focus:outline-none max-h-36 overflow-y-auto app-scrollbar"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="h-8 w-8 shrink-0 rounded-lg"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {text.length > 1800 && (
        <p className="text-xs text-app-muted mt-1 text-right">
          {text.length}/2000
        </p>
      )}
    </div>
  );
}
