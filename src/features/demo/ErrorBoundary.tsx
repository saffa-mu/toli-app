import { Component, type ReactNode } from 'react';
import { useDemo } from '@/store';

/** If anything throws, show a calm recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 bg-paper p-8 text-center"
        role="alert"
      >
        <h1 className="font-display text-3xl font-semibold text-ink">Something went sideways.</h1>
        <p className="text-lg text-ink-soft">
          Reload the page, or start again below. Your data stays on this device.
        </p>
        <button
          type="button"
          className="h-12 rounded-btn bg-teal px-6 font-semibold text-white"
          onClick={() => useDemo.getState().reset()}
        >
          Start again
        </button>
      </div>
    );
  }
}
