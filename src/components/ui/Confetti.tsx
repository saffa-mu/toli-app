import type { CSSProperties } from 'react';

const COLOURS = ['#F59E0B', '#0F766E', '#A9DCD4', '#FDE9BF', '#5EAAA0'];

/** A single small confetti burst (CSS only). Plays once; hidden with reduced motion. */
export function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const dist = 90 + ((i * 37) % 70);
    const style = {
      '--dx': `${Math.cos(angle) * dist}px`,
      '--dy': `${Math.sin(angle) * dist + 60}px`,
      '--rot': `${(i * 47) % 360}deg`,
      background: COLOURS[i % COLOURS.length],
      animationDelay: `${(i % 5) * 30}ms`,
    } as CSSProperties;
    return <span key={i} className="confetti-piece absolute h-2.5 w-1.5 rounded-sm" style={style} />;
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/3 h-0 w-0" aria-hidden>
      {pieces}
    </div>
  );
}
