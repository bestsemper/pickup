import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-8 overflow-hidden" style={{ background: 'var(--background-secondary)', height: 'calc(100vh - 73px)' }}>
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--primary)' }}>Pickup</h1>
        <p className="text-2xl mb-8" style={{ color: 'var(--foreground-secondary)' }}>
          Find spontaneous games and activities happening right now
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link 
            href="/map" 
            className="home-button-primary px-8 py-4 rounded-lg transition text-lg font-semibold text-white"
          >
            Map View
          </Link>
          <Link 
            href="/list" 
            className="home-button-secondary px-8 py-4 rounded-lg transition text-lg font-semibold text-white"
          >
            List View
          </Link>
        </div>

        <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>How it works:</h2>
          <ul className="text-left space-y-2" style={{ color: 'var(--foreground-secondary)' }}>
            <li>Create a pickup game or activity</li>
            <li>Events last 60 minutes (or custom duration)</li>
            <li>See what&apos;s happening near you</li>
            <li>Join instantly and meet up</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
