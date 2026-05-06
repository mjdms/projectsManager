"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { useScraper } from "@/context/ScraperContext"
import { Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"

let L: any
if (typeof window !== "undefined") {
  L = require("leaflet")
}

const mapAnimationStyles = `
  @keyframes gridPulse {
    0%, 100% { fill-opacity: 0; }
    50% { fill-opacity: 0.15; }
  }
  .grid-cell-pulse {
    animation: gridPulse 6s infinite;
    fill-opacity: 0;
  }
  @keyframes spiralFill {
    0%, 15% { fill-opacity: 0; }
    30% { fill-opacity: 0.08; }
    60%, 100% { fill-opacity: 0; }
  }
  .spiral-zone-0 { animation: spiralFill 5s ease-in-out 0s infinite; }
  .spiral-zone-1 { animation: spiralFill 5s ease-in-out 0.8s infinite; }
  .spiral-zone-2 { animation: spiralFill 5s ease-in-out 1.6s infinite; }
  .spiral-zone-3 { animation: spiralFill 5s ease-in-out 2.4s infinite; }
  .spiral-zone-4 { animation: spiralFill 5s ease-in-out 3.2s infinite; }
  @keyframes markerPulse {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(2.5); opacity: 0; }
  }
  .map-marker-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #3B58E6; border: 2px solid white;
    box-shadow: 0 0 0 0 rgba(59,88,230,0.5), 0 2px 8px rgba(0,0,0,0.2);
    cursor: grab; position: relative;
  }
  .map-marker-dot.has-pulse::after {
    content: ''; position: absolute;
    top: -4px; left: -4px; right: -4px; bottom: -4px;
    border-radius: 50%; background: #3B58E6;
    animation: markerPulse 2.5s ease-out infinite;
    z-index: -1;
  }
`

interface MapPickerProps {
  onSelect: (lat: number, lng: number, radius: number, maxLeads: number, keywords: string, searchMode: string) => void
}

// Shared drawing function — used by both drag handler and useEffect
function drawPreview(L: any, layer: any, lat: number, lng: number, radiusKm: number, mode: string) {
  if (!layer || !L) return
  layer.clearLayers()

  const r = radiusKm * 1000 // meters

  if (mode === "Standard") {
    L.circle([lat, lng], { radius: r, color: "#9ca3af", weight: 0.5, fill: false, interactive: false }).addTo(layer)

  } else if (mode === "Grid") {
    const steps = 6
    const rDeg = r / 111320
    const rLng = rDeg / Math.cos(lat * Math.PI / 180)

    // Grid lines clipped to circle
    for (let i = 1; i < steps; i++) {
      const offset = (i / steps) * 2 - 1
      const x = lng + offset * rLng
      const yOffset = Math.sqrt(Math.max(0, 1 - offset * offset)) * rDeg
      L.polyline([[lat - yOffset, x], [lat + yOffset, x]], { color: "#9ca3af", weight: 0.5, opacity: 0.4, interactive: false }).addTo(layer)
      const y = lat + offset * rDeg
      const xOffset = Math.sqrt(Math.max(0, 1 - offset * offset)) * rLng
      L.polyline([[y, lng - xOffset], [y, lng + xOffset]], { color: "#9ca3af", weight: 0.5, opacity: 0.4, interactive: false }).addTo(layer)
    }

    // Outer border
    L.circle([lat, lng], { radius: r, color: "#9ca3af", weight: 0.5, fill: false, interactive: false }).addTo(layer)

    // Pulsing cells — all corners must be inside circle
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const lat1 = lat + ((i / steps) * 2 - 1) * rDeg
        const lat2 = lat + (((i + 1) / steps) * 2 - 1) * rDeg
        const lng1 = lng + ((j / steps) * 2 - 1) * rLng
        const lng2 = lng + (((j + 1) / steps) * 2 - 1) * rLng

        const corners = [[lat1, lng1], [lat1, lng2], [lat2, lng1], [lat2, lng2]]
        const allInside = corners.every(([cl, cn]) => {
          return Math.sqrt(Math.pow((cl - lat) / rDeg, 2) + Math.pow((cn - lng) / rLng, 2)) <= 1.0
        })
        if (!allInside) continue

        const rect = L.rectangle([[lat1, lng1], [lat2, lng2]], {
          stroke: false,
          fillColor: "#9ca3af",
          fillOpacity: 0,
          className: "grid-cell-pulse",
          interactive: false
        }).addTo(layer)

        const el = rect.getElement()
        if (el) el.style.animationDelay = `${Math.random() * 6}s`
      }
    }

  } else if (mode === "Spiral") {
    const radii = [0, 0.1, 0.25, 0.5, 0.8, 1.0]

    const getCirclePoints = (radiusM: number) => {
      const points: [number, number][] = []
      const steps = 64
      for (let i = 0; i <= steps; i++) {
        const angle = (i * 360 / steps) * (Math.PI / 180)
        const dLat = (radiusM * Math.cos(angle)) / 111320
        const dLng = (radiusM * Math.sin(angle)) / (111320 * Math.cos(lat * Math.PI / 180))
        points.push([lat + dLat, lng + dLng])
      }
      return points
    }

    for (let idx = 1; idx < radii.length; idx++) {
      const rOuter = r * radii[idx]
      const rInner = r * radii[idx - 1]

      // Draw the outer ring border
      L.circle([lat, lng], { radius: rOuter, color: "#9ca3af", weight: 0.5, fill: false, opacity: 0.8, interactive: false }).addTo(layer)

      if (rInner === 0) {
        L.circle([lat, lng], { radius: rOuter, stroke: false, fillColor: "#9ca3af", fillOpacity: 0, className: `spiral-zone-${idx - 1}`, interactive: false }).addTo(layer)
      } else {
        const outerPts = getCirclePoints(rOuter)
        const innerPts = getCirclePoints(rInner).reverse()
        L.polygon([outerPts, innerPts], { stroke: false, fillColor: "#9ca3af", fillOpacity: 0, className: `spiral-zone-${idx - 1}`, interactive: false }).addTo(layer)
      }
    }
  }
}

export function MapPicker({ onSelect }: MapPickerProps) {
  const { scannedAreas, isSearching } = useScraper()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const historyLayerRef = useRef<any>(null)
  const previewLayerRef = useRef<any>(null)

  // Refs to always have current values in closures
  const radiusRef = useRef(50)
  const searchModeRef = useRef("Standard")

  const [radius, setRadius] = useState(50)
  const [maxLeads, setMaxLeads] = useState(50)
  const [keywords, setKeywords] = useState("")
  const [searchMode, setSearchMode] = useState("Standard")
  const [coords, setCoords] = useState<{ lat: number, lng: number }>({ lat: 52.2297, lng: 21.0122 })

  const [isKeywordsOpen, setIsKeywordsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Keep refs in sync
  useEffect(() => { radiusRef.current = radius }, [radius])
  useEffect(() => {
    searchModeRef.current = searchMode
    // Update marker pulse based on mode
    if (markerRef.current) {
      const dotIcon = L.divIcon({
        className: '',
        html: `<div class="map-marker-dot${searchMode === 'Standard' ? ' has-pulse' : ''}"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
      markerRef.current.setIcon(dotIcon)
    }
  }, [searchMode])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !L) return

    delete L.Icon.Default.prototype._getIconUrl

    const dotIcon = L.divIcon({
      className: '',
      html: '<div class="map-marker-dot has-pulse"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    })

    const map = L.map(mapRef.current, { 
      zoomControl: false, 
      attributionControl: false,
      minZoom: 4
    }).setView([coords.lat, coords.lng], 10)
    mapInstance.current = map

    const tiles = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=pl', {
      subdomains: ['mt0','mt1','mt2','mt3'],
      maxZoom: 20
    }).addTo(map)
    
    // Transform Google Maps into a premium white/clean theme
    tiles.on('add', () => {
      const container = tiles.getContainer()
      if (container) {
        container.style.filter = 'contrast(1.1) brightness(1.05) saturate(0.2)'
      }
    })
    historyLayerRef.current = L.layerGroup().addTo(map)
    previewLayerRef.current = L.layerGroup().addTo(map)

    const marker = L.marker([coords.lat, coords.lng], { draggable: !isSearching, icon: dotIcon }).addTo(map)
    markerRef.current = marker

    const circle = L.circle([coords.lat, coords.lng], {
      radius: radius * 1000,
      color: "#3B58E6",
      fillColor: "#3B58E6",
      fillOpacity: 0.07,
      weight: 1.5,
      dashArray: "6, 4"
    }).addTo(map)
    circleRef.current = circle

    map.on("click", (e: any) => {
      // Allow panning/zooming but block coordinate changes
      const job = (global as any).scraperJob; // This is client side, so we use the prop
    })

    marker.on("drag", (e: any) => {
      const { lat, lng } = e.target.getLatLng()
      circle.setLatLng([lat, lng])
      // Use refs for current values — never stale
      drawPreview(L, previewLayerRef.current, lat, lng, radiusRef.current, searchModeRef.current)
    })

    marker.on("dragend", (e: any) => {
      const { lat, lng } = e.target.getLatLng()
      setCoords({ lat, lng })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Handle marker/map locking when isSearching changes
  useEffect(() => {
    if (!markerRef.current || !mapInstance.current) return

    if (isSearching) {
      markerRef.current.dragging?.disable()
      mapInstance.current.off("click")
    } else {
      markerRef.current.dragging?.enable()
      mapInstance.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        setCoords({ lat, lng })
        markerRef.current?.setLatLng([lat, lng])
        circleRef.current?.setLatLng([lat, lng])
      })
    }
  }, [isSearching])

  useEffect(() => {
    if (!historyLayerRef.current || !L || !mapInstance.current) return
    historyLayerRef.current.clearLayers()

    if (scannedAreas.length === 0) return

    try {
      const turf = require("@turf/turf") // Dynamic import for client side

      // 128 steps is the sweet spot for smoothness vs stability
      const polygons = scannedAreas.filter(a => !isNaN(a.lat) && !isNaN(a.lng) && !isNaN(a.radius)).map(area =>
        turf.circle([area.lng, area.lat], area.radius, { steps: 128, units: 'kilometers' })
      )

      if (polygons.length === 0) return

      let merged = polygons[0]
      for (let i = 1; i < polygons.length; i++) {
        merged = turf.union(turf.featureCollection([merged, polygons[i]]))
      }

      // 0.4km buffer is enough to smooth the joints without creating "triangles" between distant areas
      merged = turf.buffer(merged, 0.4, { units: 'kilometers', steps: 32 })
      merged = turf.buffer(merged, -0.4, { units: 'kilometers', steps: 32 })

      L.geoJSON(merged, {
        style: {
          color: "#3B58E6",
          weight: 1.5,
          opacity: 0.5,
          fillColor: "#3B58E6",
          fillOpacity: 0.08,
          interactive: false
        },
        interactive: false
      }).addTo(historyLayerRef.current)
    } catch (e) {
      console.error("Turf union failed, fallback to circles", e)
      scannedAreas.forEach(area => {
        if (isNaN(area.lat) || isNaN(area.lng)) return
        L.circle([area.lat, area.lng], {
          radius: area.radius * 1000,
          color: "#3B58E6",
          weight: 1.5,
          opacity: 0.5,
          fillColor: "#3B58E6",
          fillOpacity: 0.08,
          interactive: false
        }).addTo(historyLayerRef.current!)
      })
    }
  }, [scannedAreas])

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius * 1000)
  }, [radius])

  // Main redraw on mode/coords/radius change
  useEffect(() => {
    if (!circleRef.current || !previewLayerRef.current || !L) return

    const styles: Record<string, any> = {
      Standard: { color: "#9ca3af", weight: 0, fillOpacity: 0 },
      Grid: { color: "#9ca3af", weight: 0, fillOpacity: 0 },
      Spiral: { color: "#9ca3af", weight: 0, fillOpacity: 0 }
    }

    circleRef.current.setStyle(styles[searchMode] || styles.Standard)
    drawPreview(L, previewLayerRef.current, coords.lat, coords.lng, radius, searchMode)
  }, [searchMode, coords, radius])

  return (
    <div>
      <style>{mapAnimationStyles}</style>
      <div className={cn("h-[550px] w-full rounded-xl overflow-hidden relative z-10")}>

        {/* Zoom buttons - top right */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
          <button onClick={() => mapInstance.current?.zoomIn()} className="h-8 w-8 bg-white/90 backdrop-blur-md border border-black/8 rounded-lg shadow-md flex items-center justify-center font-semibold text-foreground hover:bg-white transition-all active:scale-95 text-base leading-none">+</button>
          <button onClick={() => mapInstance.current?.zoomOut()} className="h-8 w-8 bg-white/90 backdrop-blur-md border border-black/8 rounded-lg shadow-md flex items-center justify-center font-semibold text-foreground hover:bg-white transition-all active:scale-95 text-base leading-none">−</button>
        </div>

        {/* Mode pills - top center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex bg-white/90 backdrop-blur-md border border-black/8 rounded-full p-1 shadow-md">
            {["Normal", "Grid", "Spiral"].map(m => {
              const modeId = m === "Normal" ? "Standard" : m
              return (
                <button
                  key={m}
                  onClick={() => setSearchMode(modeId)}
                  disabled={isSearching}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all disabled:opacity-40",
                    searchMode === modeId
                      ? "bg-foreground text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* Top Left - Keywords pill */}
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="relative">
            <button
              onClick={() => setIsKeywordsOpen(!isKeywordsOpen)}
              className={cn(
                "h-9 px-4 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-sm flex items-center gap-2 transition-all hover:bg-white",
                isKeywordsOpen && "bg-white"
              )}
            >
              <Search size={13} className="text-muted-foreground/50" />
              <span className="text-[12px] font-medium text-foreground max-w-[120px] truncate">
                {keywords || "All businesses"}
              </span>
            </button>

            {isKeywordsOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white/97 backdrop-blur-xl rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { label: "All", value: "" },
                    { label: "Restaurants", value: "restaurants" },
                    { label: "Dentists", value: "dentyści" },
                    { label: "Gyms", value: "siłownie" },
                    { label: "Mechanic", value: "mechanik" },
                    { label: "Hairdresser", value: "fryzjer" },
                    { label: "Lawyers", value: "prawnicy" },
                    { label: "Hotels", value: "hotele" },
                    { label: "Pharmacies", value: "apteki" },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => { setKeywords(value); setIsKeywordsOpen(false) }}
                      className={cn(
                        "text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors",
                        keywords === value
                          ? "bg-foreground text-background"
                          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative mb-3">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={isSearching}
                    className="w-full h-8 pl-8 pr-3 bg-secondary rounded-lg border-0 text-[12px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground/40"
                    placeholder="Custom keyword..."
                  />
                </div>

                <div className="h-px bg-border mb-3" />

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Radius</span>
                      <span className="text-[11px] font-bold text-primary tabular-nums">{radius} km</span>
                    </div>
                    <input type="range" min="5" max="200" step="5" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Lead Limit</span>
                      <span className="text-[11px] font-bold text-primary tabular-nums">{maxLeads}</span>
                    </div>
                    <input type="range" min="10" max="500" step="10" value={maxLeads} onChange={(e) => setMaxLeads(parseInt(e.target.value))} className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Start button / Status - bottom right */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          {isSearching ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-sm text-muted-foreground text-[13px] font-semibold cursor-not-allowed">
              <Loader2 className="animate-spin" size={14} />
              Scanning...
            </div>
          ) : (
            <button
              onClick={() => onSelect(coords.lat, coords.lng, radius, maxLeads, keywords, searchMode)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
            >
              <Search size={14} /> Start extraction
            </button>
          )}
        </div>

        <div ref={mapRef} className="h-full w-full" />
      </div>
    </div>
  )
}

