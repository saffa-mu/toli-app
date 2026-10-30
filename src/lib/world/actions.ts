import type {
  Activity,
  Consents,
  Gender,
  MeetGender,
  MeetMode,
  PartnerSource,
  QuizAnswer,
  FeltSafe,
  Prefs,
  ReportReason,
  UserId,
  VenueId,
} from '@/lib/types';

export interface PlanDraft {
  title: string;
  activity: Activity;
  venueId: VenueId;
  start: number;
  spots: number;
  womenOnly: boolean;
  note?: string;
}

export type PrefsPatch = Partial<Omit<Prefs, 'consents'>> & { consents?: Partial<Consents> };

/** Every change to the world. Each action names the acting user so two phones can share one world. */
export type Action =
  | { type: 'arriveAt'; actAs: UserId; venueId: VenueId; minutes: number }
  | { type: 'logVisit'; actAs: UserId; venueId: VenueId }
  | { type: 'dismissPrompt'; actAs: UserId }
  | { type: 'setPrefs'; actAs: UserId; prefs: PrefsPatch }
  | { type: 'sendConnect'; actAs: UserId; to: UserId; note?: string }
  | { type: 'respondConnect'; actAs: UserId; from: UserId; accept: boolean }
  | { type: 'sendMessage'; actAs: UserId; convId: string; text: string }
  | { type: 'botReply'; actAs: UserId; convId: string }
  | { type: 'typing'; actAs: UserId; convId: string; on: boolean }
  | { type: 'markRead'; actAs: UserId; convId: string }
  | { type: 'acceptToli'; actAs: UserId; toliId: string }
  | { type: 'leaveToli'; actAs: UserId; toliId: string }
  | { type: 'joinPlan'; actAs: UserId; planId: string }
  | { type: 'leavePlan'; actAs: UserId; planId: string }
  | { type: 'imHere'; actAs: UserId; planId: string }
  | { type: 'meetAgain'; actAs: UserId; planId: string; picks: UserId[] }
  | { type: 'feltSafe'; actAs: UserId; planId: string; answer: FeltSafe }
  | { type: 'hostPlan'; actAs: UserId; draft: PlanDraft }
  | { type: 'joinNextPlan'; actAs: UserId; fromPlanId: string; withIds: UserId[] }
  | { type: 'report'; actAs: UserId; against: UserId; reason: ReportReason; note: string; alsoBlock: boolean }
  | { type: 'block'; actAs: UserId; against: UserId }
  | { type: 'unblock'; actAs: UserId; against: UserId }
  | { type: 'deleteMyData'; actAs: UserId }
  | { type: 'setClock'; actAs: UserId; to: number }
  | { type: 'simulateSecondMeetup'; actAs: UserId }
  | { type: 'addMoment'; actAs: UserId; venueId: VenueId }
  | { type: 'verifyId'; actAs: UserId }
  | { type: 'addPlace'; actAs: UserId; venueId: VenueId; activity: Activity }
  | { type: 'suggestActivity'; actAs: UserId; text: string }
  | { type: 'cancelConnect'; actAs: UserId; to: UserId }
  | {
      type: 'partnerBook';
      actAs: UserId;
      venueId: VenueId;
      source: PartnerSource;
      stage: 'click' | 'booked';
      planId?: string;
    }
  | {
      type: 'completeSignup';
      actAs: UserId;
      name: string;
      age: number;
      gender: Gender;
      meetGender: MeetGender;
      meetMode: MeetMode;
      customActivities: string[];
      govId: boolean;
      activities: Activity[];
      sectors: number[];
      interests: string[];
      quiz: QuizAnswer[];
      consents: Consents;
      womenOnly: boolean;
    };
