import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import playersData from '../data/stats/players_index.json'
import DarkModeToggle from './DarkModeToggle'

const divisions = {
  'AL East': [
    { name: 'Baltimore Orioles', abbr: 'BAL' },
    { name: 'Boston Red Sox', abbr: 'BOS' },
    { name: 'New York Yankees', abbr: 'NYY' },
    { name: 'Tampa Bay Devil Rays', abbr: 'TBD' },
    { name: 'Toronto Blue Jays', abbr: 'TOR' },
  ],
  'AL Central': [
    { name: 'Chicago White Sox', abbr: 'CHW' },
    { name: 'Cleveland Indians', abbr: 'CLE' },
    { name: 'Detroit Tigers', abbr: 'DET' },
    { name: 'Kansas City Royals', abbr: 'KCR' },
    { name: 'Minnesota Twins', abbr: 'MIN' },
  ],
  'AL West': [
    { name: 'Anaheim Angels', abbr: 'ANA' },
    { name: 'Oakland Athletics', abbr: 'OAK' },
    { name: 'Seattle Mariners', abbr: 'SEA' },
    { name: 'Texas Rangers', abbr: 'TEX' },
  ],
  'NL East': [
    { name: 'Atlanta Braves', abbr: 'ATL' },
    { name: 'Florida Marlins', abbr: 'FLA' },
    { name: 'Montreal Expos', abbr: 'MON' },
    { name: 'New York Mets', abbr: 'NYM' },
    { name: 'Philadelphia Phillies', abbr: 'PHI' },
  ],
  'NL Central': [
    { name: 'Chicago Cubs', abbr: 'CHC' },
    { name: 'Cincinnati Reds', abbr: 'CIN' },
    { name: 'Houston Astros', abbr: 'HOU' },
    { name: 'Milwaukee Brewers', abbr: 'MIL' },
    { name: 'Pittsburgh Pirates', abbr: 'PIT' },
    { name: 'St. Louis Cardinals', abbr: 'STL' },
  ],
  'NL West': [
    { name: 'Arizona Diamondbacks', abbr: 'ARI' },
    { name: 'Colorado Rockies', abbr: 'COL' },
    { name: 'Los Angeles Dodgers', abbr: 'LAD' },
    { name: 'San Diego Padres', abbr: 'SDP' },
    { name: 'San Francisco Giants', abbr: 'SFG' },
  ],
}

export default function Layout({ children }) {
  const router = useRouter()
  const [showTeams, setShowTeams] = useState(false)
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (query.length === 0) {
      setFiltered([])
      setActiveIndex(-1)
    } else {
      const lower = query.toLowerCase()
      const results = playersData
        .filter(p => 
          p.name.toLowerCase().includes(lower) ||
          p.first.toLowerCase().includes(lower) ||
          p.last.toLowerCase().includes(lower)
        )
        .slice(0, 10)
      setFiltered(results)
      setActiveIndex(-1)
    }
  }, [query])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const handleSelect = (id) => {
    setQuery("")
    setFiltered([])
    setActiveIndex(-1)
    router.push(`/players/${id}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(filtered[activeIndex].id)
    }
  }

  const highlightMatch = (name) => {
    const index = name.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return name
    return (
      <>
        {name.slice(0, index)}
        <span className="font-bold text-blue-700">{name.slice(index, index + query.length)}</span>
        {name.slice(index + query.length)}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gray-900 text-white shadow-md">
        <div className="w-full px-4 py-4 flex flex-wrap items-center justify-between">
          <Link href="/" passHref>
            <a className="mr-6">
              <img src="/logos/league.png" alt="Logo" className="h-10 w-auto" />
            </a>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 relative w-full md:w-auto">
            <NavLink href="/" current={router.pathname === '/'}>Home</NavLink>
            <NavLink href="/standings" current={router.pathname.startsWith('/standings')}>Standings</NavLink>
            <NavLink href="/schedule" current={router.pathname.startsWith('/schedule')}>Schedule</NavLink>
            <div
              className="relative"
              onMouseEnter={() => setShowTeams(true)}
              onMouseLeave={() => setShowTeams(false)}
            >
              <button className="text-white hover:text-yellow-300">Teams</button>
              {showTeams && (
                <div className="absolute top-full left-0 mt-2 bg-white text-black shadow-lg z-50 rounded p-4 sm:grid sm:grid-cols-3 sm:w-[400px] w-auto max-h-96 overflow-y-auto">
                  {Object.entries(divisions).map(([division, teams]) => (
                    <div key={division}>
                      <h4 className="font-bold text-sm mb-2">{division}</h4>
                      <ul className="space-y-1">
                        {teams.map(team => (
                          <li key={team.abbr}>
                            <Link href={`/teams/${team.abbr}`} passHref>
                              <a className="text-sm hover:text-blue-600 sm:block hidden">{team.name}</a>
                              <a className="text-sm hover:text-blue-600 block sm:hidden">{team.abbr}</a>
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

            {/* Search bar */}
            <div className="relative ml-auto w-full md:w-64">
              <input
                type="text"
                placeholder="Search players..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="p-1 px-2 text-black w-full rounded"
              />
              {filtered.length > 0 && (
                <ul className="absolute mt-1 w-full bg-white text-black border border-gray-300 rounded shadow-md max-h-64 overflow-y-auto z-50">
                  {filtered.map((player, idx) => {
                    const team = player.teams?.join("/") || "TBD"
                    return (
                      <li
                        key={player.id}
                        className={`p-2 cursor-pointer flex justify-between items-center ${idx === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        onMouseDown={() => handleSelect(player.id)}
                      >
                        <span>{highlightMatch(player.name)}</span>
                        <span className="text-xs text-gray-600 ml-2">{team}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="ml-4 px-2 py-1 border rounded text-sm"
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </nav>
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto w-full">{children}</main>
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
