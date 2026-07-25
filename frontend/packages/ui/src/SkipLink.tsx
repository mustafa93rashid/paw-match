export interface SkipLinkProps {
  targetId: string;
}

/** Keyboard-only "Skip to main content" link, hidden until focused. */
export const SkipLink = ({ targetId }: SkipLinkProps) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
  >
    Skip to main content
  </a>
);
