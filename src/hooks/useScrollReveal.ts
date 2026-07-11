import { useEffect, useRef, useState } from 'react';

/**
 * Adds a 'visible' class when the element scrolls into view.
 * Returns a ref to attach to the element and a boolean for visibility state.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}