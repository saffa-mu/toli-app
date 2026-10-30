import type { Activity } from '@/lib/types';

export type ActivityGroup = 'Sports' | 'Outdoors' | 'Hobbies';

export interface ActivityMeta {
  id: Activity;
  /** Sentence-case name shown on chips. */
  name: string;
  /** Lower-case form used in public tags ("Regular · swimming · Sector 45"). */
  tag: string;
  verb: string;
  group: ActivityGroup;
  /** Interest words that point at this activity (for recommendations). */
  interests: string[];
  /** Social energy: 0 quiet, 1 either, 2 big group. */
  energy: 0 | 1 | 2;
  /** Best time of day for the "mornings or evenings" quiz question. */
  time: 'morning' | 'any' | 'evening';
}

const a = (
  id: Activity,
  name: string,
  tag: string,
  verb: string,
  group: ActivityGroup,
  interests: string[],
  energy: 0 | 1 | 2,
  time: 'morning' | 'any' | 'evening',
): ActivityMeta => ({ id, name, tag, verb, group, interests, energy, time });

export const ACTIVITIES: ActivityMeta[] = [
  a('badminton', 'Badminton', 'badminton', 'play badminton', 'Sports', ['badminton', 'cricket'], 2, 'morning'),
  a('pickleball', 'Pickleball', 'pickleball', 'play pickleball', 'Sports', ['pickleball'], 2, 'evening'),
  a('cricket', 'Cricket', 'cricket', 'play cricket', 'Sports', ['cricket'], 2, 'evening'),
  a('football', 'Football', 'football', 'play football', 'Sports', ['football'], 2, 'evening'),
  a('swimming', 'Swimming', 'swimming', 'swim', 'Sports', ['swimming'], 0, 'morning'),
  a('running', 'Running', 'running', 'run', 'Outdoors', ['running', 'podcasts'], 1, 'morning'),
  a('cycling', 'Cycling', 'cycling', 'cycle', 'Outdoors', ['cycling', 'trekking'], 1, 'morning'),
  a('trekking', 'Trekking', 'trekking', 'trek', 'Outdoors', ['trekking'], 1, 'morning'),
  a('yoga', 'Yoga', 'yoga', 'do yoga', 'Outdoors', ['yoga'], 0, 'morning'),
  a('sketching', 'Art and sketching', 'sketching', 'sketch', 'Hobbies', ['sketching', 'films'], 0, 'any'),
  a('photography', 'Photography', 'photography', 'take photos', 'Hobbies', ['photography', 'films'], 0, 'any'),
  a('boardgames', 'Board games', 'board games', 'play board games', 'Hobbies', ['board games', 'chai spots'], 1, 'evening'),
  a('bookclub', 'Book club', 'book club', 'read together', 'Hobbies', ['books', 'podcasts', 'chai spots'], 0, 'evening'),
  a('cooking', 'Cooking', 'cooking', 'cook', 'Hobbies', ['street food', 'cooking'], 1, 'evening'),
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((x) => [x.id, x])) as Record<
  Activity,
  ActivityMeta
>;
export const ACTIVITY_GROUPS: ActivityGroup[] = ['Sports', 'Outdoors', 'Hobbies'];

export const TOLI_NAMES: Record<Activity, string> = {
  badminton: 'Saturday Smashers',
  pickleball: 'Saturday Picklers',
  running: 'Saturday Striders',
  sketching: 'Saturday Sketchers',
  swimming: 'Saturday Swimmers',
  cricket: 'Saturday Strikers',
  football: 'Saturday Kickabout',
  yoga: 'Saturday Stretch',
  cycling: 'Saturday Spinners',
  trekking: 'Saturday Trailblazers',
  photography: 'Saturday Shutterbugs',
  boardgames: 'Saturday Gamers',
  bookclub: 'Saturday Readers',
  cooking: 'Saturday Cooks',
};

export const HOST_TITLES: Record<Activity, string> = {
  badminton: 'Morning doubles',
  pickleball: 'Pickleball after work',
  running: 'Easy 5K + chai',
  sketching: 'Sketch and chai',
  swimming: 'Easy laps + chai',
  cricket: 'Weekend net session',
  football: 'Five-a-side',
  yoga: 'Sunrise yoga',
  cycling: 'Sunday ride',
  trekking: 'Trail morning',
  photography: 'Photo walk',
  boardgames: 'Board game night',
  bookclub: 'Book club + chai',
  cooking: 'Cook together',
};
