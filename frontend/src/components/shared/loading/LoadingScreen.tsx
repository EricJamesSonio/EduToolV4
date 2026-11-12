"use client"

import { useDelayedFlag } from "@/hooks/useDelayedFlag"

interface LoadingScreenProps {
  status: string
  hint?: string
  delayMs?: number
}

export function LoadingScreen({
  status,
  hint,
  delayMs = 0,
}: LoadingScreenProps): React.JSX.Element | null {
  const visible = useDelayedFlag(true, delayMs)

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen bg-background text-foreground"
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

      <div className="flex flex-1 items-center px-8 py-10 lg:px-20">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center md:hidden">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-[3px] border-primary/15"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary motion-reduce:animate-none"
            />
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-primary shadow-sm">
              <img
                src="/edutool-yellow.png"
                alt="Relief-ED logo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-accent" />
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-primary">
              Relief-ED
            </span>
          </div>

          <h1 className="animate-fade-in-up font-marketing text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {status}
          </h1>

          <div
            aria-hidden="true"
            className="skeleton h-1.5 w-full max-w-xs rounded-full bg-primary/20"
          />

          {hint && (
            <p className="animate-fade-in-up text-sm leading-relaxed text-muted-foreground [animation-delay:0.15s]">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}