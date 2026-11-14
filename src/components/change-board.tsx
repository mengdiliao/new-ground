import { useEffect, useState } from 'react';

const changes = ['GRADUATING', 'GOING ABROAD', 'A NEW JOB', 'MOVING HOME', 'WHAT’S NEXT?'];
export function ChangeBoard() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % changes.length), 3400);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="change-board" aria-label="Life changes"><span className="sr-only">Graduating, going abroad, a new job, moving home, what's next?</span><div key={index} className="change-letters" aria-hidden="true">{Array.from({ length: 12 }, (_, position) => <span className="change-tile" key={position}>{changes[index]?.[position] ?? ' '}</span>)}</div><span className="board-light" aria-hidden="true" /></div>;
}