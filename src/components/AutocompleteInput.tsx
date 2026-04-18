import { useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: Props) {
  const [focus, setFocus] = useState(false)

  const filtered = useMemo(() => {
    const v = value.trim().toLowerCase()
    const uniq = Array.from(new Set(suggestions.filter(Boolean)))
    if (!v) return uniq.slice(0, 8)
    return uniq
      .filter((s) => s.toLowerCase().includes(v) && s.toLowerCase() !== v)
      .slice(0, 8)
  }, [value, suggestions])

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 120)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        autoComplete="off"
        autoCapitalize="words"
      />
      {focus && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(s)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
