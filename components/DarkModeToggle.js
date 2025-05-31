import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const className = 'dark'
    const bodyClass = window.document.body.classList
    enabled ? bodyClass.add(className) : bodyClass.remove(className)
  }, [enabled])

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="px-2 py-1 border rounded-md text-sm mt-2"
    >
      {enabled ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
