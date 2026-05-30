/**
 * Caps any Ant Design Modal body at 70% of the dynamic viewport height and scrolls
 * internally, so the page behind the modal never scrolls — only the modal body does.
 * Apply via the Modal `classNames={{ body: MODAL_BODY_SCROLL }}` prop.
 *
 * NOTE: the `max-h-[70dvh]` literal must stay in a Tailwind-scanned file (libs/ui/src/**)
 * so the utility is generated.
 */
export const MODAL_BODY_MAX_HEIGHT = '70dvh';
export const MODAL_BODY_SCROLL = 'max-h-[70dvh] overflow-y-auto';
