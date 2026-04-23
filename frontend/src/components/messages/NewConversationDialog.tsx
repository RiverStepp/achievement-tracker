import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
 
type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (recipientPublicId: string, content: string) => Promise<void>;
};
 
export function NewConversationDialog({ open, onClose, onSend }: Props) {
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const handleSend = async () => {
    const trimmedId = recipientId.trim();
    const trimmedContent = content.trim();
 
    if (!trimmedId) {
      setError("Recipient ID is required.");
      return;
    }
    if (!trimmedContent) {
      setError("Message cannot be empty.");
      return;
    }
    if (trimmedContent.length > 2000) {
      setError("Message must be under 2000 characters.");
      return;
    }
 
    setSending(true);
    setError(null);
    try {
      await onSend(trimmedId, trimmedContent);
      setRecipientId("");
      setContent("");
      onClose();
    } catch {
      setError("Failed to send message. Check the recipient ID and try again.");
    } finally {
      setSending(false);
    }
  };
 
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRecipientId("");
      setContent("");
      setError(null);
      onClose();
    }
  };
 
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-app-panel border-app-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="app-heading">New Message</DialogTitle>
        </DialogHeader>
 
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="recipient-id" className="text-app-text text-sm">
              Recipient Public ID
            </Label>
            <Input
              id="recipient-id"
              placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="bg-app-bg border-app-border text-app-text placeholder:text-app-muted"
              disabled={sending}
            />
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="new-msg-content" className="text-app-text text-sm">
              Message
            </Label>
            <Textarea
              id="new-msg-content"
              placeholder="Write your message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-app-bg border-app-border text-app-text placeholder:text-app-muted resize-none"
              rows={4}
              maxLength={2000}
              disabled={sending}
            />
            <p className="text-xs text-app-muted text-right">
              {content.length}/2000
            </p>
          </div>
 
          {error && <p className="text-sm text-red-400">{error}</p>}
 
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={sending}
              className="text-app-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !recipientId.trim() || !content.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
