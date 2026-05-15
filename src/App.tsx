import { useEffect, useMemo, useState } from 'react';
import './App.css';

type Mood = 'tired' | 'anxious' | 'calm' | 'focused';
type WorkStage = 'before' | 'working' | 'after';

type Settings = {
  mood: Mood;
  workStartTime: string;
  workEndTime: string;
  catEnergy: number;
};

type TimeState = {
  stage: WorkStage;
  remainingMs: number;
  progressPercent: number;
  title: string;
  detail: string;
};

const STORAGE_KEY = 'shangban.settings.v1';

const DEFAULT_SETTINGS: Settings = {
  mood: 'tired',
  workStartTime: '09:00',
  workEndTime: '18:00',
  catEnergy: 2,
};

const moodOptions: Array<{ value: Mood; label: string; tone: string }> = [
  { value: 'tired', label: '有点累', tone: '陪你慢慢来' },
  { value: 'anxious', label: '有点烦', tone: '先把呼吸放慢' },
  { value: 'calm', label: '还可以', tone: '保持这个节奏' },
  { value: 'focused', label: '想专注', tone: '只看下一件事' },
];

const moodMessages: Record<Mood, Record<WorkStage, string>> = {
  tired: {
    before: '先不用精神满格，坐下也算开始。',
    working: '你已经在坚持了，我会在旁边陪着你。',
    after: '今天的电量可以放心收起来了。',
  },
  anxious: {
    before: '先吸一口气，事情可以一件一件来。',
    working: '不用同时解决全部，只处理眼前这一小段。',
    after: '已经安全落地了，剩下的明天再说。',
  },
  calm: {
    before: '状态很稳，轻轻进入今天就好。',
    working: '这个节奏不错，继续保持，不用用力过猛。',
    after: '收工时间到了，今天完成得很好。',
  },
  focused: {
    before: '选一个最小任务，先打开它。',
    working: '把注意力交给下一步，时间会自己往前走。',
    after: '专注模式结束，可以切回生活频道。',
  },
};

function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      mood: isMood(parsed.mood) ? parsed.mood : DEFAULT_SETTINGS.mood,
      workStartTime: isTimeValue(parsed.workStartTime)
        ? parsed.workStartTime
        : DEFAULT_SETTINGS.workStartTime,
      workEndTime: isTimeValue(parsed.workEndTime)
        ? parsed.workEndTime
        : DEFAULT_SETTINGS.workEndTime,
      catEnergy:
        typeof parsed.catEnergy === 'number'
          ? Math.min(4, Math.max(0, parsed.catEnergy))
          : DEFAULT_SETTINGS.catEnergy,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function isMood(value: unknown): value is Mood {
  return ['tired', 'anxious', 'calm', 'focused'].includes(String(value));
}

function isTimeValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function getTargetDate(now: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

function getTimeState(now: Date, startTime: string, endTime: string): TimeState {
  const start = getTargetDate(now, startTime);
  const end = getTargetDate(now, endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  if (now < start) {
    return {
      stage: 'before',
      remainingMs: start.getTime() - now.getTime(),
      progressPercent: 0,
      title: '距离上班',
      detail: '小猫正在帮你把今天轻轻打开',
    };
  }

  if (now >= end) {
    return {
      stage: 'after',
      remainingMs: 0,
      progressPercent: 100,
      title: '已经下班',
      detail: '可以把自己还给自己了',
    };
  }

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));

  return {
    stage: 'working',
    remainingMs: end.getTime() - now.getTime(),
    progressPercent,
    title: '距离下班',
    detail: '不用喜欢上班，也可以温柔地撑到下班',
  };
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
}

function formatClock(date: Date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CatCompanion({ energy, stage }: { energy: number; stage: WorkStage }) {
  const eyeClass = stage === 'after' ? 'cat-eye rested' : 'cat-eye';

  return (
    <div className="cat-shell" aria-label="陪伴小猫">
      <svg className="cat" viewBox="0 0 220 190" role="img" aria-hidden="true">
        <path
          className="cat-tail"
          d="M164 128c31 6 43-15 36-33-5-13-20-14-26-5-7 11 3 24 18 18"
        />
        <path className="cat-body" d="M53 116c0-37 24-64 58-64s58 27 58 64v20c0 28-21 42-58 42s-58-14-58-42z" />
        <path className="cat-ear" d="M62 65 48 24l39 24z" />
        <path className="cat-ear" d="M160 65 174 24l-39 24z" />
        <path className="cat-inner-ear" d="M62 53 56 34l18 12z" />
        <path className="cat-inner-ear" d="M160 53l6-19-18 12z" />
        <circle className={eyeClass} cx="88" cy="99" r="6" />
        <circle className={eyeClass} cx="134" cy="99" r="6" />
        <path className="cat-nose" d="M108 113h8l-4 5z" />
        <path className="cat-mouth" d="M112 120c-4 7-12 7-15 1" />
        <path className="cat-mouth" d="M112 120c4 7 12 7 15 1" />
        <path className="cat-whisker" d="M77 114H39" />
        <path className="cat-whisker" d="M78 124 43 133" />
        <path className="cat-whisker" d="M143 114h38" />
        <path className="cat-whisker" d="M142 124l35 9" />
        <path className="cat-paw" d="M82 157c4-12 17-12 21 0" />
        <path className="cat-paw" d="M119 157c4-12 17-12 21 0" />
      </svg>
      <div className="energy-row" aria-label={`小猫陪伴能量 ${energy + 1} 格`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span className={index <= energy ? 'energy-dot active' : 'energy-dot'} key={index} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const timeState = useMemo(
    () => getTimeState(now, settings.workStartTime, settings.workEndTime),
    [now, settings.workEndTime, settings.workStartTime],
  );

  const catMessage = moodMessages[settings.mood][timeState.stage];
  const selectedMood = moodOptions.find((option) => option.value === settings.mood);

  return (
    <main className="app">
      <section className="workspace" aria-label="上班陪伴台">
        <div className="hero-copy">
          <p className="eyebrow">Shangban</p>
          <h1>小猫陪你上班。</h1>
          <p className="subtitle">{timeState.detail}</p>
        </div>

        <section className="dashboard" aria-label="倒计时和小猫陪伴">
          <div className="timer-panel">
            <div className="timer-meta">
              <span>{timeState.title}</span>
              <span>{formatClock(now)}</span>
            </div>
            <div className="timer-value" aria-live="polite">
              {formatDuration(timeState.remainingMs)}
            </div>
            <div className="progress-track" aria-label={`今日进度 ${Math.round(timeState.progressPercent)}%`}>
              <div className="progress-fill" style={{ width: `${timeState.progressPercent}%` }} />
            </div>
            <div className="timer-foot">
              <span>{settings.workStartTime}</span>
              <span>{Math.round(timeState.progressPercent)}%</span>
              <span>{settings.workEndTime}</span>
            </div>
          </div>

          <div className="companion-panel">
            <CatCompanion energy={settings.catEnergy} stage={timeState.stage} />
            <div className="speech">
              <span>{selectedMood?.tone}</span>
              <p>{catMessage}</p>
            </div>
          </div>
        </section>

        <section className="controls" aria-label="偏好设置">
          <div className="control-group">
            <label htmlFor="start-time">上班</label>
            <input
              id="start-time"
              type="time"
              value={settings.workStartTime}
              onChange={(event) =>
                setSettings((current) => ({ ...current, workStartTime: event.target.value }))
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="end-time">下班</label>
            <input
              id="end-time"
              type="time"
              value={settings.workEndTime}
              onChange={(event) =>
                setSettings((current) => ({ ...current, workEndTime: event.target.value }))
              }
            />
          </div>
          <div className="control-group wide">
            <span>现在</span>
            <div className="mood-grid">
              {moodOptions.map((option) => (
                <button
                  className={settings.mood === option.value ? 'mood-button active' : 'mood-button'}
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      mood: option.value,
                      catEnergy: Math.min(4, current.catEnergy + 1),
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
