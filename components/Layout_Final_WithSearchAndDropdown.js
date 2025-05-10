import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'

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
  const [players, setPlayers] = useState([])
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    async function fetchPlayers() {
      const res = await fetch('/data/stats/players_combined.json')
      const data = await res.json()
      setPlayers(data)
    }
    fetchPlayers()
  }, [])

  useEffect(() => {
    if (query.length === 0) {
      setFiltered([])
      setActiveIndex(-1)
    } else {
      const results = players
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
      setFiltered(results)
      setActiveIndex(-1)
    }
  }, [query, players])

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" passHref>
            <a className="mr-6">
              <img src="/logos/league.png" alt="Logo" className="h-10 w-auto" />
            </a>
          </Link>
          <nav className="flex space-x-6 relative items-center">
            <NavLink href="/" current={router.pathname === '/'}>Home</NavLink>
            <NavLink href="/standings" current={router.pathname.startsWith('/standings')}>Standings</NavLink>
            <NavLink href="/schedule" current={router.pathname.startsWith('/schedule')}>Schedule</NavLink>
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

            {/* Search bar */}
            <div className="relative ml-4 w-64">
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
                    const team = (player.batting?.[0]?.team || player.pitching?.[0]?.team || player.fielding?.[0]?.team || "").toUpperCase()
                    return (
                      <li
                        key={player.id}
                        className={\`p-2 cursor-pointer flex justify-between items-center \${idx === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}\`}
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
      <a className={\`text-lg font-medium px-2 \${current ? 'text-yellow-400 underline' : 'text-white hover:text-yellow-300'}\`}>
        {children}
      </a>
    </Link>
  )
}