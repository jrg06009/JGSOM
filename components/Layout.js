import Link from 'next/link'
import { useRouter } from 'next/router'

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Standings', path: '/standings' },
  { name: 'Schedule', path: '/schedule' },
  { name: 'Teams', path: '/teams/ARI' },
  { name: 'Batting', path: '/batting' },
  { name: 'Pitching', path: '/pitching' },
  { name: 'Fielding', path: '/fielding' }
]

export default function Layout({ children }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="mr-6">
            <img src="/logos/league.png" alt="Logo" className="h-10 w-auto" />
          </Link>
          <nav className="flex space-x-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={\`\${router.pathname.startsWith(item.path) ? 'text-yellow-400 font-semibold' : 'text-white hover:text-yellow-300'} px-2\`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
