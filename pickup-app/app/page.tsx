import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-4 text-blue-600">Pickup</h1>
        <p className="text-2xl mb-8 text-gray-700">
          Find spontaneous games and activities happening right now
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link 
            href="/map" 
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
          >
            Map View
          </Link>
          <Link 
            href="/list" 
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            List View
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <ul className="text-left space-y-2 text-gray-700">
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
