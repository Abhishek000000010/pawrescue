export interface Mission {
  id: string;
  title: string;
  type: 'feeding' | 'transport' | 'foster';
  distance: string;
  description: string;
  urgent?: boolean;
  isNew?: boolean;
  image?: string;
  status: 'open' | 'claimed' | 'completed';
}

export interface StrayCat {
  id: string;
  name: string;
  age: string;
  breed: string;
  gender: 'Male' | 'Female';
  status: 'Urgent' | 'Stable' | 'Fostered' | 'Adopted';
  image: string;
  description: string;
  location: string;
  reportedAt: string;
  tags: string[];
}

export interface Guardian {
  id: string;
  name: string;
  title: string;
  exp: string;
  avatar: string;
  streak: number;
  level: string;
}

export interface TestimonialStory {
  id: string;
  catName: string;
  author: string;
  role: string;
  quote: string;
  beforeImage: string;
  afterImage: string;
  details: string;
  location: string;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  iconName: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    time: string;
  };
  content: string;
  title?: string;
  image?: string;
  beforeAfter?: {
    beforeImg: string;
    afterImg: string;
    beforeLabel: string;
    afterLabel: string;
  };
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  comments: Array<{
    author: string;
    text: string;
    avatar: string;
  }>;
  tags?: string[];
  isSuccessStory?: boolean;
  reactions?: Record<string, number>;
  userReaction?: string;
}

