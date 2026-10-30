import { DAY_MS, MINUTE, formatDayTime } from '@/lib/clock';
import { genericReply, keywordReply, BOT_SCRIPTS } from '@/data/bots';
import { TOLI_NAMES } from '@/data/activities';
import { venueInRadius } from '@/lib/geo';
import { isVerifiedRegular } from '@/lib/rules/regular';
import { canConnect, canHost, canJoinSuggested } from '@/lib/rules/verification';
import { canJoin, hasEnded, imHereOpen, MAX_SPOTS, MIN_SPOTS, planEnd } from '@/lib/rules/plans';
import { shouldForm, acceptedCount } from '@/lib/rules/tolis';
import type {
  Conversation,
  EventType,
  MetricEvent,
  Message,
  Plan,
  Toli,
  User,
  UserId,
  World,
} from '@/lib/types';
import type { Action } from './actions';

/** The regulars in Haryashwa's suggested toli. */
const DEMO_COHORT: UserId[] = ['aman', 'kabir', 'neha'];

export const firstName = (w: World, id: UserId) => w.users[id]?.name.split(' ')[0] ?? 'Someone';

/** Mutable helpers over a cloned draft of the world. */
class Draft {
  constructor(public d: World) {}

  id(prefix: string): string {
    this.d.seq += 1;
    return `${prefix}-${this.d.seq}`;
  }

  event(type: EventType, userId: UserId, props: MetricEvent['props'] = {}) {
    this.d.events.push({ id: this.id('e'), type, at: this.d.clock, userId, props });
  }

  notify(userId: UserId, text: string, link?: string) {
    this.d.notifications.push({ id: this.id('n'), userId, text, at: this.d.clock, link });
  }

  conv(id: string | undefined): Conversation | undefined {
    return this.d.conversations.find((c) => c.id === id);
  }

  plan(id: string): Plan | undefined {
    return this.d.plans.find((p) => p.id === id);
  }

  toli(id: string): Toli | undefined {
    return this.d.tolis.find((t) => t.id === id);
  }

  dmBetween(a: UserId, b: UserId): Conversation | undefined {
    return this.d.conversations.find(
      (c) => c.kind === 'dm' && c.members.includes(a) && c.members.includes(b),
    );
  }

  post(
    conv: Conversation,
    authorId: UserId | 'system',
    text: string,
    kind: Message['kind'] = 'text',
    planId?: string,
  ) {
    conv.messages.push({
      id: this.id('m'),
      authorId,
      text,
      at: this.d.clock,
      kind: authorId === 'system' && kind === 'text' ? 'system' : kind,
      planId,
    });
    if (authorId !== 'system') conv.readUpTo[authorId] = conv.messages.length;
  }

  newGroup(title: string, members: UserId[]): Conversation {
    const conv: Conversation = {
      id: this.id('grp'),
      kind: 'group',
      title,
      members: [...members],
      messages: [],
      readUpTo: {},
    };
    this.d.conversations.push(conv);
    return conv;
  }

  /** Make sure a plan has a group chat, created on first join. */
  ensurePlanChat(plan: Plan): Conversation {
    const existing = this.conv(plan.chatId);
    if (existing) return existing;
    const conv = this.newGroup(plan.title, plan.members);
    this.post(conv, 'system', plan.title, 'plan', plan.id);
    plan.chatId = conv.id;
    return conv;
  }

  joinPlan(plan: Plan, userId: UserId) {
    plan.members.push(userId);
    this.event('plan_joined', userId, { planId: plan.id });
    const conv = this.ensurePlanChat(plan);
    if (!conv.members.includes(userId)) conv.members.push(userId);
    this.post(
      conv,
      'system',
      `${firstName(this.d, userId)} joined the plan · ${plan.members.length} of ${plan.spots} spots`,
    );
  }

  leavePlan(plan: Plan, userId: UserId) {
    plan.members = plan.members.filter((m) => m !== userId);
    const conv = this.conv(plan.chatId);
    if (conv)
      this.post(
        conv,
        'system',
        `${firstName(this.d, userId)} left the plan · ${plan.members.length} of ${plan.spots} spots`,
      );
  }

  /** A request for an activity we do not list yet. Kept once per person per name. */
  suggestActivity(userId: UserId, text: string) {
    const name = text.trim().slice(0, 40);
    const key = name.toLowerCase();
    if (!name || this.d.activitySuggestions.some((s) => s.userId === userId && s.text.toLowerCase() === key))
      return;
    this.d.activitySuggestions.push({ userId, text: name, at: this.d.clock });
    this.event('activity_suggested', userId, { text: name });
  }

  formToli(toli: Toli, actAs: UserId) {
    toli.status = 'formed';
    const accepted = toli.members.filter((m) => m.state === 'accepted').map((m) => m.userId);
    const plan: Plan = {
      id: this.id('plan'),
      title: toli.name,
      activity: toli.activity,
      venueId: toli.venueId,
      hostId: accepted[0],
      start: toli.proposedStart,
      durationMin: 90,
      spots: Math.min(MAX_SPOTS, Math.max(MIN_SPOTS, toli.members.length + 2)),
      members: [],
      attended: [],
      womenOnly: toli.womenOnly,
      toliId: toli.id,
      meetAgain: {},
      feltSafe: {},
      note: 'Suggested by Toli for your group: same place, same slot you already go.',
    };
    this.d.plans.push(plan);
    const conv = this.newGroup(toli.name, accepted);
    plan.chatId = conv.id;
    toli.planId = plan.id;
    toli.chatId = conv.id;
    this.post(conv, 'system', `Toli formed: ${accepted.length} of ${accepted.length} accepted`);
    this.post(conv, 'system', plan.title, 'plan', plan.id);
    this.event('toli_formed', actAs, { toliId: toli.id, size: accepted.length });
    for (const id of accepted)
      this.notify(id, `${toli.name} formed! Your group chat is open.`, `/chat/${conv.id}`);
  }
}

function lastHumanText(conv: Conversation, bot: UserId): string {
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    const m = conv.messages[i];
    if (m.kind === 'text' && m.authorId !== bot) return m.text;
  }
  return '';
}

export function applyAction(w: World, a: Action): World {
  const x = new Draft(structuredClone(w));
  const d = x.d;
  const me = a.actAs;

  switch (a.type) {
    case 'arriveAt': {
      d.clock += a.minutes * MINUTE;
      d.prompt = d.users[me]?.prefs.smartCheckin
        ? { userId: me, venueId: a.venueId, minutes: a.minutes }
        : null;
      break;
    }
    case 'logVisit': {
      const recent = d.visits.some(
        (v) => v.userId === me && v.venueId === a.venueId && d.clock - v.at < 60 * MINUTE,
      );
      if (d.prompt?.userId === me) d.prompt = null;
      if (recent) break;
      const wasRegular = isVerifiedRegular(d, me, a.venueId);
      d.visits.push({ id: x.id('v'), userId: me, venueId: a.venueId, at: d.clock });
      x.event('checkin', me, { venueId: a.venueId });
      if (!wasRegular && isVerifiedRegular(d, me, a.venueId))
        x.event('regular_badge', me, { venueId: a.venueId });
      break;
    }
    case 'dismissPrompt': {
      if (d.prompt?.userId === me) d.prompt = null;
      break;
    }
    case 'setPrefs': {
      const u = d.users[me];
      if (!u) break;
      const { consents, ...rest } = a.prefs;
      if (rest.womenOnly && (u.gender !== 'F' || !u.verification.govId)) delete rest.womenOnly;
      if (rest.notifications === false && u.prefs.notifications) x.event('notif_optout', me);
      u.prefs = { ...u.prefs, ...rest, consents: { ...u.prefs.consents, ...consents } };
      break;
    }
    case 'sendConnect': {
      const exists = d.connections.some(
        (c) =>
          c.status !== 'declined' && ((c.from === me && c.to === a.to) || (c.from === a.to && c.to === me)),
      );
      if (exists || me === a.to || !canConnect(d, me, a.to)) break;
      d.connections.push({ id: x.id('c'), from: me, to: a.to, status: 'pending', note: a.note, at: d.clock });
      x.event('connect_sent', me, { to: a.to });
      x.notify(a.to, `${firstName(d, me)} wants to connect`, '/chats');
      break;
    }
    case 'respondConnect': {
      const c = d.connections.find((k) => k.from === a.from && k.to === me && k.status === 'pending');
      if (!c) break;
      c.status = a.accept ? 'connected' : 'declined';
      if (!a.accept) break;
      let conv = x.dmBetween(me, a.from);
      if (!conv) {
        conv = { id: x.id('dm'), kind: 'dm', members: [a.from, me], messages: [], readUpTo: {} };
        d.conversations.push(conv);
      }
      x.post(conv, 'system', 'You are connected. Say hi!');
      x.event('connect_accepted', me, { from: a.from });
      x.notify(a.from, `${firstName(d, me)} accepted. Your chat is open.`, `/chat/${conv.id}`);
      break;
    }
    case 'sendMessage': {
      const conv = x.conv(a.convId);
      const text = a.text.trim();
      if (!conv || !text || !conv.members.includes(me)) break;
      x.post(conv, me, text);
      if (d.typing[conv.id] === me) d.typing[conv.id] = undefined;
      break;
    }
    case 'botReply': {
      const conv = x.conv(a.convId);
      if (!conv) break;
      const key = `${conv.id}:${me}`;
      const cursor = d.botCursor[key] ?? 0;
      const kwKey = `${key}:kw`;
      const incoming = lastHumanText(conv, me);
      const kw = keywordReply(me, incoming);
      const usedKw = d.botCursor[kwKey] === conv.messages.length;
      const script = BOT_SCRIPTS[me] ?? [];
      let text: string;
      if (kw && !usedKw) {
        text = kw;
        d.botCursor[kwKey] = conv.messages.length + 1;
      } else if (cursor < script.length) {
        text = script[cursor];
        d.botCursor[key] = cursor + 1;
      } else {
        text = genericReply(cursor);
        d.botCursor[key] = cursor + 1;
      }
      x.post(conv, me, text);
      if (d.typing[conv.id] === me) d.typing[conv.id] = undefined;
      break;
    }
    case 'typing': {
      if (a.on) {
        d.typing[a.convId] = me;
        const conv = x.conv(a.convId);
        if (conv) conv.readUpTo[me] = conv.messages.length;
      } else if (d.typing[a.convId] === me) d.typing[a.convId] = undefined;
      break;
    }
    case 'markRead': {
      const conv = x.conv(a.convId);
      if (conv && conv.members.includes(me)) conv.readUpTo[me] = conv.messages.length;
      break;
    }
    case 'acceptToli': {
      const toli = x.toli(a.toliId);
      const member = toli?.members.find((m) => m.userId === me);
      if (!toli || !member || member.state === 'accepted' || !canJoinSuggested(d, me)) break;
      member.state = 'accepted';
      if (toli.status === 'suggested') toli.status = 'forming';
      if (shouldForm(toli)) x.formToli(toli, me);
      else if (toli.status === 'formed') {
        const conv = x.conv(toli.chatId);
        if (conv) {
          if (!conv.members.includes(me)) conv.members.push(me);
          x.post(
            conv,
            'system',
            `${firstName(d, me)} accepted the toli · ${acceptedCount(toli)} of ${toli.members.length}`,
          );
        }
      }
      break;
    }
    case 'leaveToli': {
      const toli = x.toli(a.toliId);
      if (!toli) break;
      toli.members = toli.members.filter((m) => m.userId !== me);
      const plan = toli.planId ? x.plan(toli.planId) : undefined;
      if (plan?.members.includes(me)) x.leavePlan(plan, me);
      const conv = x.conv(toli.chatId);
      if (conv) {
        conv.members = conv.members.filter((m) => m !== me);
        x.post(conv, 'system', `${firstName(d, me)} left the toli`);
      }
      break;
    }
    case 'joinPlan': {
      const plan = x.plan(a.planId);
      if (plan && canJoin(d, plan, me)) x.joinPlan(plan, me);
      break;
    }
    case 'leavePlan': {
      const plan = x.plan(a.planId);
      if (plan?.members.includes(me)) x.leavePlan(plan, me);
      break;
    }
    case 'imHere': {
      const plan = x.plan(a.planId);
      if (!plan || !plan.members.includes(me) || plan.attended.includes(me) || !imHereOpen(plan, d.clock))
        break;
      plan.attended.push(me);
      x.event('attended', me, { planId: plan.id });
      const conv = x.conv(plan.chatId);
      if (conv)
        x.post(
          conv,
          'system',
          `${firstName(d, me)} is here · ${plan.attended.length} of ${plan.members.length} here`,
        );
      const toli = plan.toliId ? x.toli(plan.toliId) : undefined;
      if (toli && plan.attended.length >= 2 && toli.status === 'formed') toli.status = 'happened';
      break;
    }
    case 'meetAgain': {
      const plan = x.plan(a.planId);
      if (!plan || !plan.attended.includes(me) || !hasEnded(plan, d.clock) || me in plan.meetAgain) break;
      const picks = a.picks.filter((p) => p !== me && plan.attended.includes(p));
      plan.meetAgain[me] = picks;
      // Only the count is logged. Who was picked stays private.
      x.event('meet_again_pick', me, { planId: plan.id, count: picks.length });
      for (const other of picks) {
        if (!plan.meetAgain[other]?.includes(me)) continue;
        x.event('mutual_meet_again', me, { planId: plan.id, pair: [me, other].sort() });
        x.notify(other, `You and ${firstName(d, me)} both want to meet again.`, `/plan/${plan.id}`);
      }
      break;
    }
    case 'feltSafe': {
      const plan = x.plan(a.planId);
      if (!plan || !plan.attended.includes(me) || me in plan.feltSafe) break;
      plan.feltSafe[me] = a.answer;
      x.event('felt_safe', me, { planId: plan.id, answer: a.answer });
      break;
    }
    case 'hostPlan': {
      const { draft } = a;
      if (!canHost(d, me)) break;
      if (draft.spots < MIN_SPOTS || draft.spots > MAX_SPOTS || draft.start <= d.clock || !draft.title.trim())
        break;
      const plan: Plan = {
        id: x.id('plan'),
        title: draft.title.trim(),
        activity: draft.activity,
        venueId: draft.venueId,
        hostId: me,
        start: draft.start,
        durationMin: 90,
        spots: draft.spots,
        members: [],
        attended: [],
        womenOnly: draft.womenOnly && d.users[me]?.gender === 'F',
        meetAgain: {},
        feltSafe: {},
        note: draft.note,
      };
      d.plans.push(plan);
      x.joinPlan(plan, me);
      break;
    }
    case 'joinNextPlan': {
      const from = x.plan(a.fromPlanId);
      if (!from) break;
      const already = d.plans.find((p) => p.title === from.title && p.start === from.start + 7 * DAY_MS);
      if (already) {
        if (canJoin(d, already, me)) x.joinPlan(already, me);
        break;
      }
      const plan: Plan = {
        ...from,
        id: x.id('plan'),
        hostId: a.withIds[0] ?? me,
        start: from.start + 7 * DAY_MS,
        members: [],
        attended: [],
        meetAgain: {},
        feltSafe: {},
        note: 'Same place, same time, same people. Suggested after your meet-again match.',
      };
      d.plans.push(plan);
      for (const id of [...a.withIds, me]) x.joinPlan(plan, id);
      break;
    }
    case 'report': {
      d.reports.push({
        id: x.id('r'),
        by: me,
        against: a.against,
        reason: a.reason,
        note: a.note,
        at: d.clock,
        open: true,
      });
      x.event('report', me, { reason: a.reason });
      if (a.alsoBlock && !d.blocks.some((b) => b.by === me && b.against === a.against))
        d.blocks.push({ by: me, against: a.against });
      break;
    }
    case 'block': {
      if (!d.blocks.some((b) => b.by === me && b.against === a.against))
        d.blocks.push({ by: me, against: a.against });
      for (const c of d.connections)
        if (c.status === 'pending' && [c.from, c.to].includes(me) && [c.from, c.to].includes(a.against))
          c.status = 'declined';
      break;
    }
    case 'unblock': {
      d.blocks = d.blocks.filter((b) => !(b.by === me && b.against === a.against));
      break;
    }
    case 'deleteMyData': {
      const u = d.users[me];
      if (!u) break;
      d.visits = d.visits.filter((v) => v.userId !== me);
      d.connections = d.connections.filter((c) => c.from !== me && c.to !== me);
      d.conversations = d.conversations
        .filter((c) => !(c.kind === 'dm' && c.members.includes(me)))
        .map((c) => ({ ...c, members: c.members.filter((m) => m !== me) }));
      for (const p of d.plans) {
        p.members = p.members.filter((m) => m !== me);
        p.attended = p.attended.filter((m) => m !== me);
        p.meetAgain = Object.fromEntries(Object.entries(p.meetAgain).filter(([k]) => k !== me));
        p.feltSafe = Object.fromEntries(Object.entries(p.feltSafe).filter(([k]) => k !== me));
      }
      for (const t of d.tolis) t.members = t.members.filter((m) => m.userId !== me);
      d.blocks = d.blocks.filter((b) => b.by !== me);
      d.notifications = d.notifications.filter((n) => n.userId !== me);
      u.prefs = {
        womenOnly: false,
        smartCheckin: false,
        notifications: false,
        consents: { location: false, photos: false, quiz: false },
      };
      u.routines = [];
      u.interests = [];
      u.bio = '';
      break;
    }
    case 'setClock': {
      if (a.to <= d.clock) break;
      const before = d.clock;
      d.clock = a.to;
      d.prompt = null;
      for (const p of d.plans) {
        const opens = p.start - 15 * MINUTE;
        if (opens > before && d.clock >= opens && d.clock <= p.start + 60 * MINUTE)
          for (const id of p.members)
            x.notify(
              id,
              `${p.title} starts at ${formatDayTime(p.start).split(', ')[1]}. Tap "I'm here" when you arrive.`,
              `/plan/${p.id}`,
            );
        const end = planEnd(p);
        if (end > before && end <= d.clock && p.attended.length >= 2)
          for (const id of p.attended)
            x.notify(id, `How was ${p.title}? Tell us privately who you would meet again.`, `/plan/${p.id}`);
      }
      break;
    }
    case 'completeSignup': {
      const u = d.users[me];
      if (!u) break;
      u.name = a.name.trim() || u.name;
      u.age = a.age || u.age;
      u.gender = a.gender;
      u.meetGender = a.meetGender;
      u.meetMode = a.meetMode;
      if (a.govId) u.verification.govId = true;
      // Places: for each chosen activity (in the order picked), venues within 100 km that offer it,
      // in a chosen neighbourhood if any match.
      const days = u.routines[0]?.days ?? [6];
      const routines: User['routines'] = [];
      for (const activity of a.activities) {
        const offering = Object.values(d.venues).filter(
          (v) => v.activities.includes(activity) && venueInRadius(d, me, v.id),
        );
        const inSector = offering.filter((v) => a.sectors.includes(v.sector));
        for (const v of inSector.length ? inSector : offering) {
          if (routines.some((r) => r.venueId === v.id)) continue;
          routines.push({
            venueId: v.id,
            activity,
            days,
            slot: u.routines.find((r) => r.venueId === v.id)?.slot ?? 'early',
          });
        }
      }
      u.routines = routines;
      for (const text of a.customActivities) x.suggestActivity(me, text);
      if (a.interests.length) u.interests = a.interests.map((i) => i.toLowerCase());
      if (a.quiz.length === 4) u.quiz = [a.quiz[0], a.quiz[1], a.quiz[2], a.quiz[3]];
      u.prefs = {
        ...u.prefs,
        consents: a.consents,
        womenOnly: a.womenOnly && a.gender === 'F' && u.verification.govId,
      };
      // Demo: Haryashwa's story follows his choice. His earlier visits, his suggested toli and its
      // three regulars move to the place he picked, so the whole flow runs there.
      const main = u.routines[0];
      if (me === 'rohan' && main && main.venueId !== 'court9') {
        const moveVisits = (id: UserId) => {
          for (const v of d.visits) if (v.userId === id && v.venueId === 'court9') v.venueId = main.venueId;
        };
        moveVisits(me);
        for (const id of DEMO_COHORT) {
          const c = d.users[id];
          c.routines = c.routines.map((r) =>
            r.venueId === 'court9' ? { ...r, venueId: main.venueId, activity: main.activity } : r,
          );
          moveVisits(id);
        }
        for (const t of d.tolis)
          if (t.members.some((m) => m.userId === me)) {
            t.venueId = main.venueId;
            t.activity = main.activity;
            t.name = TOLI_NAMES[main.activity];
          }
      }
      break;
    }
    case 'addMoment': {
      const u = d.users[me];
      const checkedIn = d.visits.some((v) => v.userId === me && v.venueId === a.venueId);
      if (!u || !checkedIn || !venueInRadius(d, me, a.venueId) || u.verification.moments >= 6) break;
      u.verification.moments += 1;
      x.event('verified', me, { step: 'moment' });
      break;
    }
    case 'verifyId': {
      const u = d.users[me];
      if (!u || u.verification.govId) break;
      u.verification.govId = true;
      x.event('verified', me, { step: 'govId' });
      break;
    }
    case 'addPlace': {
      const u = d.users[me];
      const v = d.venues[a.venueId];
      if (!u || !v || !v.activities.includes(a.activity) || !venueInRadius(d, me, a.venueId)) break;
      if (!u.routines.some((r) => r.venueId === a.venueId))
        u.routines.push({ venueId: a.venueId, activity: a.activity, days: [6], slot: 'early' });
      break;
    }
    case 'suggestActivity': {
      x.suggestActivity(me, a.text);
      break;
    }
    case 'cancelConnect': {
      d.connections = d.connections.filter(
        (c) => !(c.from === me && c.to === a.to && c.status === 'pending'),
      );
      break;
    }
    case 'partnerBook': {
      const v = d.venues[a.venueId];
      if (!v?.partner) break;
      const props: MetricEvent['props'] = { venueId: a.venueId, source: a.source };
      if (a.planId) props.planId = a.planId;
      const clicked = d.events.some(
        (e) =>
          e.type === 'partner_click' &&
          e.userId === me &&
          e.props.venueId === a.venueId &&
          e.props.planId === a.planId,
      );
      if (!clicked) x.event('partner_click', me, props);
      if (a.stage === 'booked') x.event('partner_booked', me, props);
      break;
    }
    case 'simulateSecondMeetup': {
      const planId = x.id('sim-meetup');
      for (const id of ['rohan', 'aman']) x.event('attended', id, { planId, simulated: true });
      break;
    }
  }
  return d;
}
