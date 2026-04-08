import type { Post } from "@/types/post";
import { mockUserProfile } from "@/data/mockUser";

const rotatingAuthors = [
  {
    userID: 2,
    displayName: "Lena Park",
    handle: "lenap",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    userID: 3,
    displayName: "Miguel Rios",
    handle: "miguelr",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    userID: 4,
    displayName: "Avery Chen",
    handle: "averyc",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  },
  {
    userID: 5,
    displayName: "Jordan Ellis",
    handle: "jordane",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  },
];

const mockPostTemplates = [
  "Spent the evening cleaning up side quests before I touch the main story again.",
  "Another night, another rare achievement that absolutely did not respect my time.",
  "I keep saying I will stop achievement hunting at midnight. That has not happened once.",
  "Backlog update: one game finished, three more somehow installed.",
  "Tried a speedrun route for fun and accidentally found a better farming path.",
  "That boss looked impossible until I stopped panic-rolling every attack.",
  "Grinding collectibles is still better than pretending I will ever ignore map markers.",
  "Got the achievement first try, which means I have probably used up all my luck this week.",
  "I opened the game to test one build and somehow lost four hours.",
  "Patch notes said the challenge was easier now. They were lying.",
  "Tonight's goal was five achievements. I got one, but it was a good one.",
  "Turns out the best strategy was slowing down and actually reading the objective text.",
];

const generatedMockPosts: Post[] = Array.from({ length: 60 }, (_, index) => {
  const author = rotatingAuthors[index % rotatingAuthors.length];
  const template = mockPostTemplates[index % mockPostTemplates.length];
  const createdAt = new Date(Date.UTC(2026, 0, 25, 22, 0, 0) - index * 1000 * 60 * 73);
  const hasImage = index % 10 === 0;

  return {
    postID: 400 + index,
    author,
    content: {
      text: `${template} Session #${index + 1}.`,
      imageUrl: hasImage
        ? `https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80&sig=${index + 1}`
        : null,
    },
    metadata: {
      createdAt: createdAt.toISOString(),
      updatedAt: index % 9 === 0 ? new Date(createdAt.getTime() + 1000 * 60 * 18).toISOString() : null,
    },
    likes: {
      count: 3 + ((index * 7) % 29),
      users: [],
      userHasLiked: index % 4 === 0,
    },
  };
});

export const mockHomeFeedPosts: Post[] = [
  {
    postID: 304,
    author: {
      userID: 2,
      displayName: "Lena Park",
      handle: "lenap",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    content: {
      text: "Wrapped up a co-op session with three new achievements in Deep Rock. Worth every chaotic minute.",
      imageUrl:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    },
    metadata: {
      createdAt: "2026-01-28T02:05:00.000Z",
      updatedAt: null,
    },
    likes: {
      count: 24,
      users: [],
      userHasLiked: true,
    },
  },
  ...generatedMockPosts,
  ...(mockUserProfile.feed?.items ?? []),
  {
    postID: 305,
    author: {
      userID: 3,
      displayName: "Miguel Rios",
      handle: "miguelr",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    content: {
      text: "Started treating my backlog like a ranked ladder. One completed game in, twelve to go.",
    },
    metadata: {
      createdAt: "2026-01-26T16:40:00.000Z",
      updatedAt: "2026-01-26T17:05:00.000Z",
    },
    likes: {
      count: 9,
      users: [],
      userHasLiked: false,
    },
  },
].sort(
  (left, right) =>
    new Date(right.metadata.createdAt).getTime() -
    new Date(left.metadata.createdAt).getTime()
);
