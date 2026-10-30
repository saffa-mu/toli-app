import type { UserId } from '@/lib/types';

/** Lines each bot uses in order, after a short typing indicator. Friendly, never personal. */
export const BOT_SCRIPTS: Record<UserId, string[]> = {
  aman: [
    'Saturday 6:30 as usual? Samarth and Gunjan usually come too.',
    'Bring your racket, I always carry spare shuttles.',
    'Toli suggested a Saturday group for us. Accept karo, it will be fun.',
    'See you on court, bro!',
  ],
  kabir: [
    'Arre nice, finally a fourth for doubles!',
    'Fair warning: I shout a lot when I win. And when I lose.',
    'Vada pav is my one weakness. Gurugram has not found a good one yet.',
    'Saturday it is.',
  ],
  neha: [
    'Hiii! Saturday mornings are the best part of my week.',
    'I am the one with the purple racket, you can not miss it.',
    'Chai after is non-negotiable, just saying.',
    'See you there!',
  ],
  ishita: [
    'Welcome! Sketch Sundays is very chill, just bring a pencil.',
    'We usually sit near the fountain if the weather is nice.',
    'No talent needed, I promise. Half of us draw stick figures.',
    'See you Sunday!',
  ],
  sana: [
    'Hi! The Sunday run is easy pace, nobody gets left behind.',
    'We do 5K then chai. Sometimes more chai than running.',
    'It is a women-only group, so it is very relaxed.',
    'See you Sunday morning!',
  ],
  sameer: [
    'Arre, Lucknow se? Kya baat hai!',
    'The beginner mixer is very relaxed, all levels welcome.',
    'We should find proper kebabs in this city together.',
    'See you on court, bhai.',
  ],
};

const GENERIC = [
  'Haha, sahi hai. See you at the next game!',
  'Sounds good to me.',
  'Done. Looking forward to it!',
];

/** Keyword replies so free typing never meets silence. Per-person overrides first, then generic. */
const KEYWORDS: { match: RegExp; generic: string; byUser?: Record<UserId, string> }[] = [
  {
    match: /chai|tea/i,
    generic: 'Chai is always a yes!',
    byUser: {
      aman: 'Always! Cutting chai at the tapri after the game is basically mandatory. Samarth and Gunjan usually join.',
      neha: 'Yes please, cutting chai after every game!',
    },
  },
  {
    match: /saturday|sat\b|6:30/i,
    generic: 'Saturday works for me!',
    byUser: { aman: 'Haan, Saturday 6:30 as usual. I will book the court.' },
  },
  {
    match: /court/i,
    generic: 'Usually the one at the far end, it has the best lights.',
    byUser: { aman: 'The one at the far end, near the window. Best lights, least wind.' },
  },
  { match: /\b(hi|hello|hey|namaste)\b/i, generic: 'Hi! Good to finally put a name to the face.' },
];

export function keywordReply(userId: UserId, text: string): string | undefined {
  const hit = KEYWORDS.find((k) => k.match.test(text));
  return hit ? (hit.byUser?.[userId] ?? hit.generic) : undefined;
}

export function genericReply(n: number): string {
  return GENERIC[n % GENERIC.length];
}

/** Bot meet-again behaviour: everyone picks everyone, except where the story needs otherwise. */
export const MEET_AGAIN_SKIPS: Record<UserId, UserId[]> = {
  kabir: ['rohan'],
};

export const ICEBREAKERS = [
  'Chai after the game?',
  'Which court do you usually take?',
  'Saturday 6:30 as usual?',
];
