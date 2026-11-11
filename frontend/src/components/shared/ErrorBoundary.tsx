"use client"

import React from "react"
import { ErrorState } from "@/components/shared/status/ErrorState"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  section?: string
  onReset?: () => void
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
}

function keysChanged(previous: unknown[] = [], next: unknown[] = []): boolean {
  if (previous.length !== next.length) return true
  return previous.some((value, index) => !Object.is(value, next[index]))
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info)
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      keysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset()
    }
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    const { section } = this.props

    return (
      <ErrorState
        title={
          section ? `${section} couldn't be shown` : "Something went wrong"
        }
        description="An unexpected problem stopped this part of the page. The rest of the page still works."
        onRetry={this.reset}
      />
    )
  }
}