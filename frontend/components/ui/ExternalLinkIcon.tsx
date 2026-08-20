export interface ExternalLinkIconProps {
  className?: string;
}

/** Small "opens in a new tab" affordance icon, used next to outbound links. */
export default function ExternalLinkIcon({
  className = "h-3 w-3",
}: ExternalLinkIconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 5h5v5M18.5 5.5 10 14M8 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
