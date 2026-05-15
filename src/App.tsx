import { useEffect, useMemo, useState } from 'react';
import CatScene from './CatScene';
import './App.css';

type WorkStage = 'before' | 'working' | 'after';

type Settings = {
  workStartTime: string;
  workEndTime: string;
};

type TimeState = {
  stage: WorkStage;
  remainingMs: number;
  label: string;
};

const STORAGE_KEY = 'shangban.settings.v1';

const DEFAULT_SETTINGS: Settings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
};

function isTimeValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      workStartTime: isTimeValue(parsed.workStartTime)
        ? parsed.workStartTime
        : DEFAULT_SETTINGS.workStartTime,
      workEndTime: isTimeValue(parsed.workEndTime)
        ? parsed.workEndTime
        : DEFAULT_SETTINGS.workEndTime,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
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
      label: '距离上班',
    };
  }

  if (now >= end) {
    return {
      stage: 'after',
      remainingMs: 0,
      label: '已下班',
    };
  }

  return {
    stage: 'working',
    remainingMs: end.getTime() - now.getTime(),
    label: '距离下班',
  };
}

function getClockParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(Math.min(99, hours)).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function FlipUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flip-unit" aria-label={`${label} ${value}`}>
      <div className="flip-card" key={value}>
        <span>{value}</span>
      </div>
      <span className="flip-label">{label}</span>
    </div>
  );
}

export default function App() {
  const settings = useMemo(() => loadSettings(), []);
  const now = useNow();
  const timeState = useMemo(
    () => getTimeState(now, settings.workStartTime, settings.workEndTime),
    [now, settings.workEndTime, settings.workStartTime],
  );
  const clock = getClockParts(timeState.remainingMs);

  return (
    <main className="app" data-stage={timeState.stage}>
      <div className="scene-layer" aria-label="可交互立体三花猫">
        <CatScene stage={timeState.stage} />
      </div>

      <div className="brand-mark" aria-label="Shangban">
        Shangban
      </div>

      <section className="clock-dock" aria-label={`${timeState.label} ${clock.hours}:${clock.minutes}:${clock.seconds}`}>
        <span className="clock-state">{timeState.label}</span>
        <div className="flip-clock" aria-live="polite">
          <FlipUnit label="H" value={clock.hours} />
          <FlipUnit label="M" value={clock.minutes} />
          <FlipUnit label="S" value={clock.seconds} />
        </div>
      </section>
    </main>
  );
}
