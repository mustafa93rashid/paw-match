import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@paw-match/utilities";
import { VisuallyHidden } from "./VisuallyHidden";

export interface RowAction {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Shown as a native title/tooltip on the disabled item, explaining why it's unavailable. */
  disabledReason?: string;
}

export interface RowActionsMenuProps {
  actions: RowAction[];
  label?: string;
}

const MENU_WIDTH = 224; // w-56
const MENU_GAP = 4; // matches the old `mt-1` spacing between trigger and menu
const VIEWPORT_PADDING = 8;
const ESTIMATED_ITEM_HEIGHT = 40;
const MENU_VERTICAL_PADDING = 12; // p-1.5 top + bottom

interface MenuPosition {
  top: number;
  left: number;
  placement: "bottom" | "top";
}

/**
 * Overflow (⋮) menu for secondary row actions — same open/outside-click/
 * Escape-key interaction already hand-rolled in NotificationBell,
 * generalized for any list of actions. This is where destructive,
 * de-emphasized actions (e.g. permanently deleting a shelter) live, rather
 * than as a primary button.
 *
 * Rendered through a portal to document.body: this menu is used inside
 * `overflow-hidden` cards (AnimalCard) and `overflow-x-auto` table
 * wrappers (Table) — a plain `position: absolute` menu gets clipped by
 * those ancestors regardless of z-index, since overflow clipping happens
 * before stacking is even considered. Portaling escapes that clipping
 * context entirely; position is computed from the trigger's own
 * getBoundingClientRect() instead of relying on CSS positioning context.
 */
export const RowActionsMenu = ({ actions, label = "Row actions" }: RowActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";

    const estimatedMenuHeight = actions.length * ESTIMATED_ITEM_HEIGHT + MENU_VERTICAL_PADDING;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: MenuPosition["placement"] =
      spaceBelow < estimatedMenuHeight + MENU_GAP && spaceAbove > spaceBelow ? "top" : "bottom";

    // Align the menu's inline-end edge with the trigger's inline-end edge
    // (right edge in LTR, left edge in RTL) — same alignment the old
    // `right-0` gave in LTR, but computed so it stays correct if this app
    // ever runs under dir="rtl".
    const left = isRtl ? rect.left : rect.right - MENU_WIDTH;
    const clampedLeft = Math.min(
      Math.max(left, VIEWPORT_PADDING),
      window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING,
    );

    const top = placement === "bottom" ? rect.bottom + MENU_GAP : rect.top - MENU_GAP;

    setPosition({ top, left: clampedLeft, placement });
  };

  // Runs synchronously after the trigger's layout is committed, so the menu
  // never flashes at a stale position before its first paint.
  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    calculatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);

      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const onReposition = () => calculatePosition();

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    // capture: true — catches scroll on any scrollable ancestor (the
    // table's own overflow-x-auto wrapper, a scrollable page region, ...),
    // not just window scroll, since inner-element scroll doesn't bubble.
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
        <VisuallyHidden>{label}</VisuallyHidden>
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position.placement === "bottom" ? position.top : undefined,
              bottom: position.placement === "top" ? window.innerHeight - position.top : undefined,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="z-[999] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                title={action.disabled ? action.disabledReason : undefined}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  action.tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {action.icon && <action.icon className="h-4 w-4 shrink-0" aria-hidden />}
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
