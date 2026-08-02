import { useState, useEffect, useRef } from 'react';

export function useScrollAnimation() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element); // Stop observing once visible
        }
      },
      {
        rootMargin: '0px', // Trigger when the element starts to enter the viewport
        threshold: 0.1, // Trigger when at least 10% of the element is visible
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return { ref, isInView };
}
