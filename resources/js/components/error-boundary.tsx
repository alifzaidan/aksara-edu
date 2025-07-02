import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const Fallback = this.props.fallback;
                return <Fallback error={this.state.error} retry={this.retry} />;
            }

            return (
                <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                    <AlertTriangle className="text-red-500 mb-4 h-16 w-16" />
                    <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Maaf, terjadi kesalahan tak terduga. Silakan coba lagi.
                    </p>
                    {this.state.error && (
                        <details className="mb-4 text-xs text-muted-foreground">
                            <summary className="cursor-pointer">Detail Error</summary>
                            <pre className="mt-2 text-left bg-gray-100 p-2 rounded text-xs overflow-auto">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                    <Button onClick={this.retry}>
                        Coba Lagi
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
