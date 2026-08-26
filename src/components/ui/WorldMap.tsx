'use client'

import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  ES: [-3.7, 40.4],
  MX: [-102.5, 23.6],
  AR: [-63.6, -38.4],
  CO: [-74.2, 4.5],
  CL: [-71.5, -35.6],
  PE: [-75.0, -9.1],
  VE: [-66.5, 10.4],
  EC: [-78.1, -1.8],
  BO: [-64.9, -16.3],
  PY: [-58.4, -23.4],
  UY: [-55.7, -32.5],
  BR: [-51.9, -14.2],
  US: [-95.7, 37.1],
  FR: [2.2, 46.2],
  GB: [-3.4, 55.3],
  DE: [10.4, 51.1],
  IT: [12.5, 41.8],
  PT: [-8.2, 39.3],
}

interface CountryData {
  country: string
  count: number
}

export function WorldMap() {
  const [data, setData] = useState<CountryData[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/user-countries')
      .then(r => r.json())
      .then((d: CountryData[]) => {
        setData(d)
        setTotal(d.reduce((sum, c) => sum + c.count, 0))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="w-full space-y-3">
      {total > 0 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-brand-600 dark:text-brand-400">{total}</span> arqueros en{' '}
          <span className="font-bold text-brand-600 dark:text-brand-400">{data.length}</span> {data.length === 1 ? 'país' : 'países'}
        </p>
      )}
                  <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-slate-900">
                <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 160, center: [0, 0] }}
          width={960}
          height={500}
          style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {data.map(({ country, count }) => {
            const coords = COUNTRY_COORDINATES[country]
            if (!coords) return null
            return (
              <Marker key={country} coordinates={coords}>
                <circle
                  r={Math.min(4 + count * 1.5, 12)}
                  fill="#0c8fe6"
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </Marker>
            )
          })}
        </ComposableMap>
      </div>
    </div>
  )
}