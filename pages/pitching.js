import { useState } from 'react'
import fs from 'fs'
import path from 'path'
import SortableTable from '../components/SortableTable'

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'data', 'stats', 'pitching.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  return {
    props: {
      data,
    },
  }
}

export default function PitchingPage({ data }) {
  const [showQualified, setShowQualified] = useState(false)
  const [showSplit, setShowSplit] = useState(true)

  const filteredData = data.filter(player => {
    const ip = parseFloat(player.IP || 0)
    const isQualified = !showQualified || ip >= 5 // adjust IP threshold if needed
    const isSplitOK =
      showSplit ||
      player.team === 'TOT' ||
      !data.some(p => p["Player ID"] === player["Player ID"] && p.team === 'TOT')
    return isQualified && isSplitOK
  })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pitching Stats</h1>

      <div className="mb-4 flex gap-6 items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showQualified}
            onChange={() => setShowQualified(!showQualified)}
            className="mr-2"
          />
          Only show qualified players
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showSplit}
            onChange={() => setShowSplit(!showSplit)}
            className="mr-2"
          />
          Show split seasons
        </label>
      </div>

      <SortableTable
        title="League Pitching"
        data={filteredData}
        defaultSortKey="IP"
        exclude={["Player ID"]}
        nameLinkField="Player"
        idField="Player ID"
        linkBase="/players"
      />
    </div>
  )
}
