import { ist } from '@/lib/clock';
import type { Conversation, Message, UserId } from '@/lib/types';

type Line = [UserId | 'system', string, number] | [UserId | 'system', string, number, 'plan', string];

function thread(
  id: string,
  kind: 'dm' | 'group',
  members: UserId[],
  lines: Line[],
  title?: string,
): Conversation {
  const messages: Message[] = lines.map(([authorId, text, at, kind2, planId], i) => ({
    id: `${id}-m${i}`,
    authorId,
    text,
    at,
    kind: kind2 ?? (authorId === 'system' ? 'system' : 'text'),
    planId,
  }));
  const readUpTo: Record<UserId, number> = {};
  for (const m of members) readUpTo[m] = messages.length;
  return { id, kind, title, members, messages, readUpTo };
}

const oct = (day: number, h: number, m = 0) => ist(2026, 10, day, h, m);

export const SEED_CHATS: Conversation[] = [
  thread(
    'dm-aman-kabir',
    'dm',
    ['aman', 'kabir'],
    [
      ['kabir', 'Bhai Saturday 6:30 confirm?', oct(26, 21, 4)],
      ['aman', 'Confirm. I got a new tube of shuttles, the feather ones', oct(26, 21, 6)],
      ['kabir', 'Feather wale! Fancy. Someone got a bonus', oct(26, 21, 6)],
      ['aman', 'Haha no, they were on sale. Gunjan is coming too', oct(26, 21, 8)],
      ['kabir', 'Good, then we can finally play proper doubles', oct(26, 21, 9)],
      ['aman', 'Last week you served into the net 6 times, proper doubles is ambitious', oct(26, 21, 11)],
      ['kabir', 'That was the wind. There is no wind indoors. Still the wind.', oct(26, 21, 12)],
      ['aman', 'Haha ok. See you at 6:20, chai after', oct(26, 21, 15)],
    ],
  ),
  thread(
    'dm-aman-neha',
    'dm',
    ['aman', 'neha'],
    [
      [
        'neha',
        'Hey, does anyone have a spare racket for Saturday? Mine has a broken string',
        oct(27, 19, 30),
      ],
      ['aman', 'I will bring two, take whichever you like', oct(27, 19, 42)],
      ['neha', 'You are a lifesaver. I owe you a chai', oct(27, 19, 43)],
      ['aman', 'Deal. Samarth owes me three already', oct(27, 19, 45)],
      [
        'neha',
        'Haha. Also is there a new person joining? Toli said something about a group',
        oct(27, 19, 47),
      ],
      ['aman', 'Maybe, there is a guy who plays Mon Wed Sat. We will see', oct(27, 19, 50)],
    ],
  ),
  thread(
    'grp-smashers-1017',
    'group',
    ['aman', 'kabir', 'neha', 'sameer'],
    [
      ['system', 'Toli formed: 3 of 3 accepted', oct(14, 20, 0)],
      ['system', 'Saturday Smashers', oct(14, 20, 0), 'plan', 'plan-past-1017'],
      ['aman', 'Welcome everyone! Saturday 6:30, I have shuttles', oct(14, 20, 5)],
      ['neha', 'Excited! First time playing with a group here', oct(14, 20, 20)],
      ['sameer', 'Coming from Sector 54, will be there by 6:25', oct(15, 8, 2)],
      ['kabir', 'Good game today! Gunjan that drop shot was unfair', oct(17, 8, 10)],
      ['neha', 'Hehe practice. Chai at the tapri?', oct(17, 8, 11)],
      ['aman', 'Already ordered four cutting chai', oct(17, 8, 12)],
      ['sameer', 'Same time next week? I might be at Smash Arena but will try', oct(17, 9, 30)],
    ],
    'Saturday Smashers (17 Oct)',
  ),
  thread(
    'dm-ishita-tanvi',
    'dm',
    ['ishita', 'tanvi'],
    [
      ['ishita', 'Tanvi, coming for Sketch Sundays this week?', oct(27, 18, 0)],
      ['tanvi', 'Yes! Should I bring charcoal or just pencils?', oct(27, 18, 10)],
      ['ishita', 'Pencils are perfect. We will draw the old banyan tree near the fountain', oct(27, 18, 12)],
      ['tanvi', 'Love that. I will bring an extra sketchbook in case someone new comes', oct(27, 18, 15)],
      ['ishita', 'So sweet. 8 am, and I will bring a flask of filter coffee', oct(27, 18, 16)],
      ['tanvi', 'Now I am definitely coming', oct(27, 18, 18)],
    ],
  ),
  thread(
    'dm-rohan-meera',
    'dm',
    ['rohan', 'meera'],
    [
      ['system', 'You are connected. Say hi!', oct(8, 19, 0)],
      ['meera', 'Good game at Pink City Courts today! Come again when you are in Jaipur.', oct(8, 19, 5)],
      ['rohan', 'Will do. That kachori place you told me about was unreal', oct(8, 19, 12)],
    ],
  ),
];
