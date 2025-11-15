export const ACTIVITY_TYPES = [
  'Sports',
  'Club',
  'Entertainment',
  'Study',
  'Other'
] as const;

export const SPORTS_SUBTYPES = [
  'Basketball',
  'Soccer',
  'Football',
  'Spikeball',
  'Ultimate Frisbee',
  'Pickleball',
  'Tennis',
  'Volleyball',
  'Badminton',
  'Other'
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
export type SportsSubtype = typeof SPORTS_SUBTYPES[number];
