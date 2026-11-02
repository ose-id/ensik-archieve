const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps keyboard focus inside `container` while `active` is true: focus moves
 * to the first control when it opens, Tab / Shift+Tab wrap around inside it,
 * and focus returns to whatever opened it once it closes.
 */
export function useFocusTrap(container: Readonly<Ref<HTMLElement | undefined>>, active: Readonly<Ref<boolean>>) {
  let previouslyFocused: HTMLElement | null = null;

  function focusables() {
    return [
      ...(container.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
    ]
      .filter(element => element.getClientRects().length > 0);
  }

  function onKeydown(event: KeyboardEvent) {
    const root = container.value;
    if (event.key !== 'Tab' || !active.value || !root)
      return;

    const items = focusables();
    if (!items.length) {
      event.preventDefault();
      root.focus();
      return;
    }

    const first = items[0]!;
    const last = items.at(-1)!;
    const current = document.activeElement;
    const outside = !root.contains(current);
    if (event.shiftKey && (current === first || outside)) {
      event.preventDefault();
      last.focus();
    }
    else if (!event.shiftKey && (current === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }

  watch(active, async (isActive) => {
    if (!import.meta.client)
      return;

    if (isActive) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      await nextTick();
      const target = focusables()[0] ?? container.value;
      target?.focus({ preventScroll: true });
    }
    else {
      previouslyFocused?.focus?.({ preventScroll: true });
      previouslyFocused = null;
    }
  });

  useEventListener(import.meta.client
    ? document
    : undefined, 'keydown', onKeydown);
}
