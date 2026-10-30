/** MVP matching is weighted rules. These five weights are shown verbatim in "Why this match?". */
export const WEIGHTS = {
  place: 0.4,
  timeSlot: 0.25,
  lifeStage: 0.15,
  interests: 0.12,
  quiz: 0.08,
} as const;

export type Component = keyof typeof WEIGHTS;

export const COMPONENT_LABELS: Record<Component, string> = {
  place: 'Same place',
  timeSlot: 'Same time slot',
  lifeStage: 'Life stage',
  interests: 'Interests and languages',
  quiz: 'Vibe quiz',
};

export const COMPONENT_ORDER: Component[] = ['place', 'timeSlot', 'lifeStage', 'interests', 'quiz'];

/** People shown per week. */
export const WEEKLY_LIMIT = 5;
/** Under this many months in the city counts as "new to the city". */
export const NEW_TO_CITY_MONTHS = 24;
/** Sectors this close together count as neighbouring. */
export const NEIGHBOUR_SECTOR_GAP = 3;
