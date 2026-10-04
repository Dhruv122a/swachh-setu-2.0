import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, RotateCw, PlayCircle } from "lucide-react";

export const ErrorState = ({ title = "Something went wrong", message, onRetry }) => (
  <div data-testid="error-state" className="panel mx-auto my-10 max-w-lg p-8 text-center">
    <AlertOctagon className="mx-auto h-10 w-10 text-red-400" />
    <h2 className="mt-4 font-display text-2xl font-bold text-white">{title}</h2>
    {message && <p className="mt-2 text-sm text-slate-400">{message}</p>}
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {onRetry && (
        <button data-testid="error-retry-btn" onClick={onRetry} className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400" style={{ transition: "background-color .2s" }}>
          <RotateCw className="h-4 w-4" /> Retry
        </button>
      )}
      <Link to="/demo" data-testid="error-demo-btn" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500">
        <PlayCircle className="h-4 w-4" /> Continue in Demo Mode
      </Link>
    </div>
  </div>
);

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return <ErrorState title="This screen hit a snag" message="The prototype recovered safely. Retry or continue with the guided demo." onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
