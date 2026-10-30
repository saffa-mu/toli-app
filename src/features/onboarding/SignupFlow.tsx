import { ArrowLeft, Camera, CheckCircle2, Info, Plus, ShieldCheck, Wand2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, IconButton, ToggleChip, cx } from '@/components/ui';
import { ACTIVITIES, ACTIVITY_GROUPS } from '@/data/activities';
import { VENUES } from '@/data/venues';
import type { Activity, Consents, Gender, MeetGender, MeetMode, QuizAnswer } from '@/lib/types';
import { usePhone } from '@/features/shell/phone';

const TOTAL = 7;
const SECTORS = [...new Set(VENUES.filter((v) => v.sector > 0).map((v) => v.sector))].sort((a, b) => a - b);
const INTERESTS = [
  'Cricket',
  'Street food',
  'Sketching',
  'Films',
  'Trekking',
  'Podcasts',
  'Chai spots',
  'Music',
  'Books',
  'Travel',
  'Cooking',
  'Board games',
];
const QUIZ: { q: string; options: [string, string, string] }[] = [
  { q: 'Weekend plans are best when they are…', options: ['Planned', 'Bit of both', 'Spontaneous'] },
  { q: 'After the outing, you’d rather…', options: ['Quiet chat', 'Bit of both', 'Big group energy'] },
  { q: 'Post-outing drink?', options: ['Chai', 'Either', 'Coffee'] },
  { q: 'You’re at your best…', options: ['Mornings', 'Any time', 'Evenings'] },
];

/** Demo-only sample entries, never real data. */
const SAMPLE = {
  name: 'Haryashwa',
  age: '25',
  phone: '+91 00000 12345',
  otp: '123456',
  gender: 'M' as Gender,
  meetGender: 'any' as MeetGender,
  meetMode: 'both' as MeetMode,
  activities: ['badminton'] as Activity[],
  sectors: [56],
  interests: ['Cricket', 'Street food', 'Sketching'],
  quiz: [1, 2, 0, 1],
};

function Step({
  n,
  title,
  sub,
  children,
  cta,
  onNext,
  onAutofill,
  canNext,
}: {
  n: number;
  title: string;
  sub: string;
  children: ReactNode;
  cta?: string;
  onNext: () => void;
  onAutofill: () => void;
  canNext: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-2" data-testid={`signup-step-${n}`}>
      <div className="flex items-center gap-1">
        <IconButton label="Back" onClick={() => navigate(n === 1 ? '/welcome' : `/signup/${n - 1}`)}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="flex flex-1 gap-1" aria-label={`Step ${n} of ${TOTAL}`}>
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map((i) => (
            <span key={i} className={cx('h-1.5 flex-1 rounded-full', i <= n ? 'bg-teal' : 'bg-teal-100')} />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAutofill}
          icon={<Wand2 className="h-4 w-4" aria-hidden />}
          data-testid="autofill"
        >
          Demo autofill
        </Button>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
      <p className="mb-5 text-base text-ink-muted">{sub}</p>
      <div className="flex-1">{children}</div>
      <Button block className="mt-6" disabled={!canNext} onClick={onNext} data-testid="signup-next">
        {cta ?? 'Continue'}
      </Button>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <ToggleChip key={v} selected={value === v} onClick={() => onChange(v)}>
            {text}
          </ToggleChip>
        ))}
      </div>
    </fieldset>
  );
}

function ChipGroup({
  items,
  value,
  onChange,
  label,
}: {
  items: string[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <ToggleChip
            key={i}
            selected={value.includes(i)}
            onClick={() => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i])}
          >
            {i}
          </ToggleChip>
        ))}
      </div>
    </fieldset>
  );
}

/** Seven short steps. Never requests camera or location: the selfie check is simulated. */
export function SignupFlow() {
  const step = Number(useParams().step ?? '1');
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selfie, setSelfie] = useState<'idle' | 'scanning' | 'passed'>('idle');
  const [adult, setAdult] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [meetGender, setMeetGender] = useState<MeetGender | null>(null);
  const [meetMode, setMeetMode] = useState<MeetMode | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [sectors, setSectors] = useState<number[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [quiz, setQuiz] = useState<number[]>([-1, -1, -1, -1]);
  const [consents, setConsents] = useState<Consents>({ location: false, photos: false, quiz: false });
  const [womenOnly, setWomenOnly] = useState(false);
  const [idDone, setIdDone] = useState(false);

  const { act } = usePhone();
  const go = (n: number) => navigate(n > TOTAL ? '/recommend' : `/signup/${n}`);
  const finish = () => {
    act({
      type: 'completeSignup',
      name: name || SAMPLE.name,
      age: Number(age || SAMPLE.age),
      gender: gender ?? SAMPLE.gender,
      meetGender: meetGender ?? SAMPLE.meetGender,
      meetMode: meetMode ?? SAMPLE.meetMode,
      activities,
      customActivities: custom,
      sectors,
      interests,
      quiz: quiz.filter((q) => q >= 0) as QuizAnswer[],
      consents,
      womenOnly,
      govId: idDone,
    });
    go(TOTAL + 1);
  };
  const scan = () => {
    setSelfie('scanning');
    setTimeout(() => setSelfie('passed'), 1400);
  };
  const toggleActivity = (id: Activity) =>
    setActivities((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const addCustom = () => {
    const t = customText.trim();
    if (t && !custom.some((c) => c.toLowerCase() === t.toLowerCase())) setCustom((c) => [...c, t]);
    setCustomText('');
  };

  switch (step) {
    case 1:
      return (
        <Step
          n={1}
          title="Your phone number"
          sub="We verify every member with a one-time code."
          canNext={otpSent && otp === SAMPLE.otp}
          onNext={() => go(2)}
          onAutofill={() => {
            setPhone(SAMPLE.phone);
            setOtpSent(true);
            setOtp(SAMPLE.otp);
            go(2);
          }}
        >
          <Card tone="teal" className="mb-4 flex items-start gap-2 p-3 text-sm text-teal-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Demo mode: use 123456. No SMS is sent.
          </Card>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-muted">Mobile number</span>
            <input
              value={phone}
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91"
              className="h-12 w-full rounded-btn border border-hairline bg-white px-4 text-base"
            />
          </label>
          {!otpSent ? (
            <Button
              variant="secondary"
              block
              className="mt-3"
              disabled={phone.replace(/\D/g, '').length < 10}
              onClick={() => setOtpSent(true)}
            >
              Send code
            </Button>
          ) : (
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-semibold text-ink-muted">6-digit code</span>
              <input
                value={otp}
                inputMode="numeric"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="h-12 w-full rounded-btn border border-hairline bg-white px-4 text-center text-xl tracking-[0.5em]"
              />
            </label>
          )}
        </Step>
      );
    case 2:
      return (
        <Step
          n={2}
          title="A quick live selfie"
          sub="It proves you're a real person. It's never shown to anyone."
          canNext={selfie === 'passed'}
          onNext={() => go(3)}
          onAutofill={() => {
            setSelfie('passed');
            go(3);
          }}
        >
          <div className="relative mx-auto flex aspect-[3/4] w-56 items-center justify-center overflow-hidden rounded-[32px] bg-ink">
            <div
              className={cx(
                'absolute h-44 w-36 rounded-[50%] border-4',
                selfie === 'passed' ? 'border-teal-200' : 'border-dashed border-white/60',
                selfie === 'scanning' && 'animate-scan border-marigold',
              )}
            />
            {selfie === 'passed' ? (
              <CheckCircle2 className="h-14 w-14 text-teal-200" aria-hidden />
            ) : (
              <Camera className="h-10 w-10 text-white/70" aria-hidden />
            )}
          </div>
          <p className="mt-3 text-center font-semibold" aria-live="polite">
            {selfie === 'passed'
              ? 'Liveness check passed'
              : selfie === 'scanning'
                ? 'Checking… hold still'
                : 'Simulated camera. No camera is used.'}
          </p>
          {selfie === 'idle' && (
            <Button variant="secondary" block className="mt-3" onClick={scan}>
              Start liveness check
            </Button>
          )}
        </Step>
      );
    case 3:
      return (
        <Step
          n={3}
          title="Just checking: 18+"
          sub="Toli is for adults only."
          canNext={adult}
          onNext={() => go(4)}
          onAutofill={() => {
            setAdult(true);
            go(4);
          }}
        >
          <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-card border border-hairline bg-white px-4">
            <input
              type="checkbox"
              className="h-6 w-6 accent-[#0F766E]"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
            />
            <span className="font-medium">I confirm I'm 18 or older</span>
          </label>
        </Step>
      );
    case 4:
      return (
        <Step
          n={4}
          title="About you"
          sub="So we can show you the right people. Gender is only used for these preferences."
          canNext={name.trim().length > 0 && Number(age) >= 18 && !!gender && !!meetGender && !!meetMode}
          onNext={() => go(5)}
          onAutofill={() => {
            setName(SAMPLE.name);
            setAge(SAMPLE.age);
            setGender(SAMPLE.gender);
            setMeetGender(SAMPLE.meetGender);
            setMeetMode(SAMPLE.meetMode);
            go(5);
          }}
        >
          <div className="mb-5 flex gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-sm font-semibold text-ink-muted">First name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoComplete="given-name"
                className="h-12 w-full rounded-btn border border-hairline bg-white px-4 text-base"
                data-testid="name-input"
              />
            </label>
            <label className="w-24">
              <span className="mb-1 block text-sm font-semibold text-ink-muted">Age</span>
              <input
                value={age}
                inputMode="numeric"
                maxLength={2}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                className="h-12 w-full rounded-btn border border-hairline bg-white px-4 text-base"
                data-testid="age-input"
              />
            </label>
          </div>
          <Choice
            label="I am a"
            value={gender}
            onChange={setGender}
            options={[
              ['M', 'Man'],
              ['F', 'Woman'],
              ['O', 'Others'],
            ]}
          />
          <Choice
            label="I'd like to meet"
            value={meetGender}
            onChange={setMeetGender}
            options={[
              ['M', 'Men'],
              ['F', 'Women'],
              ['O', 'Others'],
              ['any', 'Everyone'],
            ]}
          />
          <Choice
            label="I'd rather meet"
            value={meetMode}
            onChange={setMeetMode}
            options={[
              ['solo', 'One to one'],
              ['group', 'In a group'],
              ['both', 'Both'],
            ]}
          />
          <p className="text-sm text-ink-muted">
            You'll only be shown people who also want to meet someone like you.
          </p>
        </Step>
      );
    case 5:
      return (
        <Step
          n={5}
          title="Your places and things"
          sub="Pick what you do and where. Others only ever see the sector."
          canNext={activities.length > 0 && sectors.length > 0}
          onNext={() => go(6)}
          onAutofill={() => {
            setActivities(SAMPLE.activities);
            setSectors(SAMPLE.sectors);
            setInterests(SAMPLE.interests);
            go(6);
          }}
        >
          {ACTIVITY_GROUPS.map((g) => (
            <fieldset key={g} className="mb-4">
              <legend className="mb-2 text-sm font-semibold text-ink-muted">{g}</legend>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.filter((a) => a.group === g).map((a) => (
                  <ToggleChip
                    key={a.id}
                    selected={activities.includes(a.id)}
                    onClick={() => toggleActivity(a.id)}
                  >
                    {a.name}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold text-ink-muted">Missing something? Suggest an activity</p>
            <div className="flex gap-2">
              <input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                placeholder="e.g. Rock climbing"
                maxLength={40}
                aria-label="Suggest an activity"
                className="h-11 min-w-0 flex-1 rounded-btn border border-hairline bg-white px-3 text-base"
                data-testid="suggest-input"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-4 w-4" aria-hidden />}
                onClick={addCustom}
                disabled={!customText.trim()}
              >
                Add
              </Button>
            </div>
            {custom.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {custom.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-marigold-50 px-3 py-1 text-sm font-medium"
                  >
                    {c}
                    <button
                      type="button"
                      aria-label={`Remove ${c}`}
                      onClick={() => setCustom((x) => x.filter((y) => y !== c))}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
                <p className="w-full text-xs text-ink-muted">
                  We'll look at adding these. You'll be told when they arrive.
                </p>
              </div>
            )}
          </div>
          <ChipGroup
            label="Neighbourhoods"
            items={SECTORS.map((s) => `Sector ${s}`)}
            value={sectors.map((s) => `Sector ${s}`)}
            onChange={(v) => setSectors(v.map((x) => Number(x.replace(/\D/g, ''))))}
          />
          <ChipGroup label="Interests" items={INTERESTS} value={interests} onChange={setInterests} />
        </Step>
      );
    case 6:
      return (
        <Step
          n={6}
          title="Two-minute vibe quiz"
          sub="Four quick ones. Used for matching only if you allow it."
          canNext={quiz.every((a) => a >= 0)}
          onNext={() => go(7)}
          onAutofill={() => {
            setQuiz(SAMPLE.quiz);
            go(7);
          }}
        >
          <div className="flex flex-col gap-4">
            {QUIZ.map((item, qi) => (
              <fieldset key={item.q}>
                <legend className="mb-2 font-medium">{item.q}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {item.options.map((o, oi) => (
                    <ToggleChip
                      key={o}
                      selected={quiz[qi] === oi}
                      className="justify-center px-2 text-center"
                      onClick={() => setQuiz((q) => q.map((v, i) => (i === qi ? oi : v)))}
                    >
                      {o}
                    </ToggleChip>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </Step>
      );
    default:
      return (
        <Step
          n={7}
          title="Your data, your call"
          sub="All off by default. Toli works with every one of these off."
          cta="Finish"
          canNext
          onNext={finish}
          onAutofill={finish}
        >
          <Card className="divide-y divide-hairline px-4">
            {(
              [
                ['location', 'Use my location for check-in prompts'],
                ['photos', 'Use my photos for my profile'],
                ['quiz', 'Use my quiz answers for matching'],
              ] as [keyof Consents, string][]
            ).map(([k, label]) => (
              <label key={k} className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3">
                <span className="font-medium">{label}</span>
                <input
                  type="checkbox"
                  role="switch"
                  className="h-6 w-6 accent-[#0F766E]"
                  checked={consents[k]}
                  onChange={(e) => setConsents((c) => ({ ...c, [k]: e.target.checked }))}
                />
              </label>
            ))}
          </Card>
          {gender === 'F' && (
            <div className="mt-4 rounded-card bg-teal-50 px-4 py-3">
              <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="block font-medium">Women-only mode (optional)</span>
                  <span className="block text-sm text-ink-muted">See only women, hidden from men</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  className="h-6 w-6 accent-[#0F766E]"
                  checked={womenOnly}
                  disabled={!idDone}
                  onChange={(e) => setWomenOnly(e.target.checked)}
                />
              </label>
              {idDone ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-teal-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden /> ID verified (+25% on your score)
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-ink-muted">
                    Women-only mode needs ID verification. Your ID is never shown or stored.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setIdDone(true)}>
                    Verify with DigiLocker (simulated)
                  </Button>
                </>
              )}
            </div>
          )}
          <Card tone="mist" className="mt-4 p-4 text-sm text-ink-soft">
            You'll start at <strong>{40 + (idDone ? 25 : 0)}%</strong> verified. Check in at your places and add
            photo moments to reach Trusted (75%) and meet fellow regulars.
          </Card>
        </Step>
      );
  }
}
