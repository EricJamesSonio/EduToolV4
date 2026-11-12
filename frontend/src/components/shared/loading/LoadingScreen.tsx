"use client"

import { useDelayedFlag } from "@/hooks/useDelayedFlag"

interface LoadingScreenProps {
  status: string
  hint?: string
  delayMs?: number
  animateDots?: boolean
}

const DOT_STYLES = `
@keyframes loading-screen-dot {
  0%, 80%, 100% {
    opacity: 0.15;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-0.1em);
  }
}
.loading-screen-dot {
  display: inline-block;
  animation: loading-screen-dot 1.4s ease-in-out infinite;
}
.loading-screen-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-screen-dot:nth-child(3) {
  animation-delay: 0.4s;
}
@media (prefers-reduced-motion: reduce) {
  .loading-screen-dot {
    animation: none;
    opacity: 1;
  }
}
`

function AnimatedDots(): React.JSX.Element {
  return (
    <span aria-hidden="true">
      <style>{DOT_STYLES}</style>
      <span className="loading-screen-dot">.</span>
      <span className="loading-screen-dot">.</span>
      <span className="loading-screen-dot">.</span>
    </span>
  )
}

export function LoadingScreen({
  status,
  hint,
  delayMs = 0,
  animateDots = false,
}: LoadingScreenProps): React.JSX.Element | null {
  const visible = useDelayedFlag(true, delayMs)

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-dvh flex-col bg-background text-foreground md:flex-row"
    >
      <div className="relative hidden items-center justify-center overflow-hidden bg-primary [clip-path:polygon(0_0,100%_0,86%_100%,0_100%)] md:flex md:w-[55%]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/25"
        />

        <span
          aria-hidden="true"
          className="absolute h-64 w-64 animate-ping rounded-full border border-primary-foreground/25 [animation-duration:3.6s] motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="absolute h-96 w-96 animate-ping rounded-full border border-primary-foreground/20 [animation-delay:1.2s] [animation-duration:3.6s] motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="absolute h-[34rem] w-[34rem] animate-ping rounded-full border border-primary-foreground/15 [animation-delay:2.4s] [animation-duration:3.6s] motion-reduce:animate-none"
        />

        <div className="relative flex h-44 w-44 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-6 animate-ping rounded-full bg-accent/30 [animation-duration:2.4s] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-primary-foreground/20"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-accent/40 border-t-accent motion-reduce:animate-none"
          />
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white/15 shadow-xl backdrop-blur-sm">
            <img
              src="/edutool-yellow.png"
              alt="Relief-ED logo"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <p className="absolute bottom-8 left-10 text-xs font-medium uppercase tracking-widest text-primary-foreground/60">
          Academic management platform
        </p>
      </div>

      <div className="relative flex h-[38vh] min-h-56 shrink-0 items-center justify-center overflow-hidden bg-primary [clip-path:polygon(0_0,100%_0,100%_88%,0_100%)] md:hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/25"
        />

        <span
          aria-hidden="true"
          className="absolute h-44 w-44 animate-ping rounded-full border border-primary-foreground/25 [animation-duration:3.6s] motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="absolute h-64 w-64 animate-ping rounded-full border border-primary-foreground/15 [animation-delay:1.2s] [animation-duration:3.6s] motion-reduce:animate-none"
        />

        <div className="relative flex h-32 w-32 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-4 animate-ping rounded-full bg-accent/30 [animation-duration:2.4s] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-primary-foreground/20"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-accent/40 border-t-accent motion-reduce:animate-none"
          />
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/15 shadow-xl backdrop-blur-sm">
            <img
              src="/edutool-yellow.png"
              alt="Relief-ED logo"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-8 md:px-8 md:py-10 lg:px-20">
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center md:items-start md:gap-6 md:text-left">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-accent" />
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-primary">
              Relief-ED
            </span>
          </div>

          <h1 className="animate-fade-in-up font-marketing text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {status}
            {animateDots && <AnimatedDots />}
          </h1>

          <div
            aria-hidden="true"
            className="skeleton mx-auto h-1.5 w-full max-w-xs rounded-full bg-primary/20 md:mx-0"
          />

          {hint && (
            <p className="animate-fade-in-up text-sm leading-relaxed text-muted-foreground [animation-delay:0.15s]">
              {hint}
            </p>
          )}
        </div>
      </div>

      <p className="pb-6 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 md:hidden">
        Academic management platform
      </p>
    </div>
  )
}