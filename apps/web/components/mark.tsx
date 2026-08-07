export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <ellipse cx="12" cy="18.7" rx="9.2" ry="2.7" />
      <ellipse cx="13" cy="12.2" rx="6.6" ry="2.5" />
      <ellipse cx="10.9" cy="6" rx="4.4" ry="2.25" />
    </svg>
  );
}
