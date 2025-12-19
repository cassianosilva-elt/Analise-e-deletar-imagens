import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#B91C1C', backgroundColor: '#FEF2F2', height: '100vh', overflow: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Algo deu errado (Crash)</h1>
          <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #FECACA' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{this.state.error?.toString()}</div>
            <div style={{ fontSize: '0.875rem', color: '#4B5563' }}>{this.state.error?.stack}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#DC2626', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Google login variables removed since auth is no longer used
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);