import Link from "next/link";
export function BetootMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 22C6 11 13 5 25 5c12 0 18 7 18 18S35 41 24 40l-10 4 1-8C9 33 6 28 6 22Z"
        fill="currentColor"
      />
      <ellipse cx="20" cy="22" rx="3" ry="4" fill="#192650" />
      <ellipse cx="31" cy="20" rx="3" ry="4" fill="#192650" />
      <path
        d="M21 31c3 2 7 1 9-2"
        stroke="#192650"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Brand() {
  return (
    <Link
      href="/"
      className="brand betoot-brand"
      aria-label="Betoot – Startseite"
    >
      <BetootMark className="betoot-mark" />
      <span>
        betoot<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
