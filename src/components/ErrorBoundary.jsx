import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
          <RefreshCw size={40} className="text-brand opacity-60" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn-primary"
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
