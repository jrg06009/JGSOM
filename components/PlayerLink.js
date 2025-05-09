import Link from 'next/link'
import players from '../data/players_combined.json'

const playerMap = Object.fromEntries(
  players.map(player => [player.name, player.id])
)

export default function PlayerLink({ name }) {
  const id = playerMap[name]
  if (!id) return name

  return (
    <Link href={`/players/${id}`}>
      <a className="text-blue-600 hover:underline">{name}</a>
    </Link>
  )
}