import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageCTAProps {
  onNotify: (message: string) => void;
}

export const MessageCTA: React.FC<MessageCTAProps> = ({ onNotify }) => {
  return (
    <Button
      variant="outline"
      className="border-brand/50"
      onClick={() => onNotify('Messaging coming soon')}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Message
    </Button>
  );
};
