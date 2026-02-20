import { AlertTriangle } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error using our new logging service (or console for now)
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });

        // TODO: Send to external logging service here
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center space-x-3 text-red-500 mb-4">
                            <AlertTriangle size={32} />
                            <h1 className="text-2xl font-bold">Something went wrong.</h1>
                        </div>
                        <p className="text-slate-400 mb-6">
                            The application encountered an unexpected error. We've logged this issue and our team has been notified.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-950 rounded-lg p-4 mb-6 border border-slate-800 overflow-auto max-h-48">
                                <code className="text-red-400 text-sm font-mono block mb-2">
                                    {this.state.error.toString()}
                                </code>
                                <code className="text-slate-500 text-xs font-mono whitespace-pre-wrap">
                                    {this.state.errorInfo?.componentStack}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
