import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

type WorkStage = 'before' | 'working' | 'after';
type PetMood = 'idle' | 'curious' | 'paw' | 'happy' | 'purr' | 'sleepy';

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

const soundMap = {
  paw: '/media/cat-meow-soft.ogg',
  happy: '/media/cat-meow-long.ogg',
  purr: '/media/cat-purr-clean.mp3',
} as const;

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
  const [mood, setMood] = useState<PetMood>('idle');
  const [toast, setToast] = useState('');
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const pressTimerRef = useRef<number | null>(null);
  const moodTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        window.clearTimeout(pressTimerRef.current);
      }
      if (moodTimerRef.current) {
        window.clearTimeout(moodTimerRef.current);
      }
    };
  }, []);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const resetMoodLater = (delay = 1200) => {
    if (moodTimerRef.current) {
      window.clearTimeout(moodTimerRef.current);
    }
    moodTimerRef.current = window.setTimeout(() => {
      setMood('idle');
      setToast('');
    }, delay);
  };

  const playSound = (key: keyof typeof soundMap) => {
    const audio = audioRefs.current[key];
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = key === 'happy' ? Math.random() * 2.2 : 0;
    audio.volume = key === 'purr' ? 0.58 : 0.82;
    void audio.play();
  };

  const runMood = (nextMood: PetMood, sound: keyof typeof soundMap, nextToast: string, duration = 1300) => {
    setMood(nextMood);
    setToast(nextToast);
    playSound(sound);
    resetMoodLater(duration);
  };

  return (
    <main className="app" data-stage={timeState.stage}>
      <button
        className="pet-stage"
        data-mood={mood}
        type="button"
        aria-label="独立三花猫桌宠"
        onClick={() => {
          if (didLongPressRef.current) {
            didLongPressRef.current = false;
            return;
          }
          runMood('paw', 'paw', '真棒');
        }}
        onDoubleClick={() => runMood('happy', 'happy', '再夸一次')}
        onPointerDown={() => {
          clearPressTimer();
          didLongPressRef.current = false;
          pressTimerRef.current = window.setTimeout(() => {
            didLongPressRef.current = true;
            runMood('purr', 'purr', '呼噜呼噜', 1900);
          }, 520);
        }}
        onPointerEnter={() => mood === 'idle' && setMood('curious')}
        onPointerLeave={() => {
          clearPressTimer();
          mood === 'curious' && setMood('idle');
        }}
        onPointerUp={clearPressTimer}
      >
        <span className="pet-shadow" aria-hidden="true" />
        <span className="pet-wrap">
          <img className="pet-image" src="/assets/calico-pet.png" alt="" draggable="false" />
          <span className="pet-paw" aria-hidden="true" />
        </span>
        <span className={toast ? 'pet-toast visible' : 'pet-toast'} aria-live="polite">
          {toast}
        </span>
      </button>

      {(Object.entries(soundMap) as Array<[keyof typeof soundMap, string]>).map(([key, src]) => (
        <audio
          key={key}
          ref={(node) => {
            audioRefs.current[key] = node;
          }}
          src={src}
          preload="auto"
        />
      ))}

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
