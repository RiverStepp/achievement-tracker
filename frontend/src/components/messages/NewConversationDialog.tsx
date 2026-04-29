import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

type UserSearchResult = {
  publicId: string;
  handle: string;
  displayName: string | null;
  profileImageUrl: string | null;
};
 
type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (
    recipientPublicId: string,
    content: string,
    recipient: UserSearchResult
  ) => Promise<void>;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function NewConversationDialog({ open, onClose, onSend }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const debouncedQuery = useDebounce(query, 300);


   useEffect(() => {
    const trimmed = debouncedQuery.replace(/^@/, "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }

     setSearching(true);
    api
      .get<UserSearchResult[]>(endpoints.userProfiles.search, { params: { q: trimmed } })
      .then((res) => {
        setResults(res.data);
        setDropdownOpen(res.data.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleSelect = (user: UserSearchResult) => {
    setSelected(user);
    setQuery(user.handle);
    setDropdownOpen(false);
    setError(null);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selected) setSelected(null);
  };

  const handleSend = async () => {
    if (!selected) {
      setError("Please select a recipient from the search results.");
      return;
    }
    const trimmedContent = content.trim();
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
      await onSend(selected.publicId, trimmedContent, selected);
      reset();
      onClose();
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };
 
  const reset = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setContent("");
    setError(null);
    setDropdownOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
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
            <Label htmlFor="recipient-search" className="text-app-text text-sm">
              Recipient
            </Label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  id="recipient-search"
                  placeholder="Search by handle…"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => results.length > 0 && setDropdownOpen(true)}
                  className="bg-app-bg border-app-border text-app-text placeholder:text-app-muted pr-8"
                  disabled={sending}
                  autoComplete="off"
                />
                {searching && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-app-muted" />
                )}
              </div>

              {dropdownOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-app-panel border border-app-border rounded-lg shadow-lg overflow-hidden">
                  {results.map((user) => (
                    <button
                      key={user.publicId}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-app-bg transition-colors"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                          src={user.profileImageUrl ?? undefined}
                          alt={`${user.displayName ?? user.handle} avatar`}
                        />
                        <AvatarFallback className="bg-app-border text-app-muted uppercase">
                          {(user.displayName ?? user.handle).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-app-text truncate">
                          {user.displayName ?? user.handle}
                        </p>
                        <p className="text-xs text-app-muted truncate">{user.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && query.replace(/^@/, "").trim().length >= 2 && results.length === 0 && !dropdownOpen && !selected && (
                <p className="text-xs text-app-muted mt-1.5">No users found.</p>
              )}
            </div>
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
            <p className="text-xs text-app-muted text-right">{content.length}/2000</p>
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
              disabled={sending || !selected || !content.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
