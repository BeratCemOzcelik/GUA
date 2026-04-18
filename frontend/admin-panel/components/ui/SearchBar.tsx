'use client'

import { useEffect, useState } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
}: SearchBarProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    if (local === value) return
    const timer = setTimeout(() => onChange(local), debounceMs)
    return () => clearTimeout(timer)
  }, [local, debounceMs])

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent"
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
