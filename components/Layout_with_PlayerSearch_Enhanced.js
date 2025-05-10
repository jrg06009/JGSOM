import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()
  const [players, setPlayers] = useState([])
  const [query, setQuery] = useState("")
  const [filtered, setFiltered] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef()

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
    <div>
      <header className="flex items-center justify-between p-4 bg-gray-800 text-white relative z-50">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <img src="/logos/league.png" alt="League Logo" className="h-10 cursor-pointer" />
          </Link>
          <Link href="/standings">Standings</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/batting">Batting</Link>
          <Link href="/pitching">Pitching</Link>
          <Link href="/fielding">Fielding</Link>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="p-1 px-2 text-black w-full rounded"
          />
          {filtered.length > 0 && (
            <ul className="absolute right-0 mt-1 w-full bg-white text-black border border-gray-300 rounded shadow-md max-h-64 overflow-y-auto">
              {filtered.map((player, idx) => {
                const team = (player.batting?.[0]?.team ||
                               player.pitching?.[0]?.team ||
                               player.fielding?.[0]?.team || "").toUpperCase()
                return (
                  <li
                    key={player.id}
                    ref={idx === activeIndex ? listRef : null}
                    className={\`
                      p-2 cursor-pointer flex justify-between items-center
                      \${idx === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}
                    \`}
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
      </header>

      <main className="p-4">
        {children}
      </main>
    </div>
  )
}