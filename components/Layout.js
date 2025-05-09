import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const divisions = {
  'AL East': [
    { name: 'BAL Orioles', abbr: 'BAL' },
    { name: 'BOS Red Sox', abbr: 'BOS' },
    { name: 'NYY Yankees', abbr: 'NYY' },
    { name: 'TB Rays', abbr: 'TB' },
    { name: 'TOR Blue Jays', abbr: 'TOR' },
  ],
  'AL Central': [
    { name: 'CWS White Sox', abbr: 'CWS' },
    { name: 'CLE Guardians', abbr: 'CLE' },
    { name: 'DET Tigers', abbr: 'DET' },
    { name: 'KC Royals', abbr: 'KC' },
    { name: 'MIN Twins', abbr: 'MIN' },
  ],
  'AL West': [
    { name: 'HOU Astros', abbr: 'HOU' },
    { name: 'LAA Angels', abbr: 'LAA' },
    { name: 'OAK Athletics', abbr: 'OAK' },
    { name: 'SEA Mariners', abbr: 'SEA' },
    { name: 'TEX Rangers', abbr: 'TEX' },
  ],
  'NL East': [
    { name: 'ATL Braves', abbr: 'ATL' },
    { name: 'MIA Marlins', abbr: 'MIA' },
    { name: 'NYM Mets', abbr: 'NYM' },
    { name: 'PHI Phillies', abbr: 'PHI' },
    { name: 'WSH Nationals', abbr: 'WSH' },
  ],
  'NL Central': [
    { name: 'CHC Cubs', abbr: 'CHC' },
    { name: 'CIN Reds', abbr: 'CIN' },
    { name: 'MIL Brewers', abbr: 'MIL' },
    { name: 'PIT Pirates', abbr: 'PIT' },
    { name: 'STL Cardinals', abbr: 'STL' },
  ],
  'NL West': [
    { name: 'ARI Diamondbacks', abbr: 'ARI' },
    { name: 'COL Rockies', abbr: 'COL' },
    { name: 'LA Dodgers', abbr: 'LA' },
    { name: 'SD Padres', abbr: 'SD' },
    { name: 'SF Giants', abbr: 'SF' },
  ],
}

export default function Layout({ children }) {
  const router = useRouter()
  const [showTeams, setShowTeams] = useState(false)

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" passHref>
            <a className="mr-6">
              <img src="/logos/league.png" alt="Logo" className="h-10 w-auto" />
            </a>
          </Link>
          <nav className="flex space-x-6 relative">
            <NavLink href="/" current={router.pathname === '/'}>Home</NavLink>
            <NavLink href="/standings" current={router.pathname.startsWith('/standings')}>Standings</NavLink>
            <NavLink href="/schedule" current={router.pathname.startsWith('/schedule')}>Schedule</NavLink>
            {/* Teams Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowTeams(true)}
              onMouseLeave={() => setShowTeams(false)}
            >
              <button className="text-white hover:text-yellow-300 font-medium px-2">Teams</button>
              {showTeams && (
                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white text-black shadow-lg z-50 rounded p-4 grid grid-cols-2 gap-4">
                  {Object.entries(divisions).map(([division, teams]) => (
                    <div key={division}>
                      <h4 className="font-bold text-sm mb-2">{division}</h4>
                      <ul className="space-y-1">
                        {teams.map(team => (
                          <li key={team.abbr}>
                            <Link href={`/teams/${team.abbr}`} passHref>
                              <a className="text-sm hover:text-blue-600">{team.name}</a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <NavLink href="/batting" current={router.pathname.startsWith('/batting')}>Batting</NavLink>
            <NavLink href="/pitching" current={router.pathname.startsWith('/pitching')}>Pitching</NavLink>
            <NavLink href="/fielding" current={router.pathname.startsWith('/fielding')}>Fielding</NavLink>
          </nav>
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, current, children }) {
  return (
    <Link href={href} passHref>
      <a className={`text-lg font-medium px-2 ${current ? 'text-yellow-400 underline' : 'text-white hover:text-yellow-300'}`}>
        {children}
      </a>
    </Link>
  )
}
