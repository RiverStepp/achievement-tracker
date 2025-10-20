import React from 'react';
import { Button } from '@/components/ui/button';

export const FollowButton: React.FC = () => {
  const [following, setFollowing] = React.useState(false);

  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      onClick={() => setFollowing((prev) => !prev)}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
};
