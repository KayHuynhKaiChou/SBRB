import React from 'react';
import { Result } from 'antd';

interface IErrorBoundaryState {
  hasError: boolean;
}

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * React class-based error boundary — catches render/lifecycle errors in subtree.
 * Hooks cannot handle render errors, so class component is required by React design.
 */
export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): IErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to console for dev visibility; Phase 5 can wire to error reporting service.
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try refreshing the page."
            extra={
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try again
              </button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
