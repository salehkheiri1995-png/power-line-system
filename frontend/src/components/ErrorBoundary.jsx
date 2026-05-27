import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ تحلیل پیشرفته - خطا:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: '#ff4d4d' }}>
          <h3>⚠️ خطایی رخ داده است</h3>
          <p>{this.state.error?.message || 'لطفاً کنسول را بررسی کنید'}</p>
          <button className="btn-glow" onClick={() => this.setState({ hasError: false })}>
            🔄 تلاش دوباره
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;