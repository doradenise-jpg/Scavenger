import { useCallback } from 'react'

const MONTHLY_DATA = [
  { month: 'Jan', plastic: 45, metal: 30, glass: 25 },
  { month: 'Feb', plastic: 52, metal: 35, glass: 28 },
  { month: 'Mar', plastic: 61, metal: 42, glass: 33 },
  { month: 'Apr', plastic: 58, metal: 38, glass: 31 },
  { month: 'May', plastic: 67, metal: 45, glass: 36 },
  { month: 'Jun', plastic: 73, metal: 51, glass: 42 },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useAnalyticsExport() {
  const exportToCSV = useCallback(() => {
    const headers = ['Month', 'Plastic (%)', 'Metal (%)', 'Glass (%)']
    const rows = MONTHLY_DATA.map((d) => [d.month, d.plastic, d.metal, d.glass])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    downloadBlob(new Blob([csv], { type: 'text/csv' }), `analytics-${Date.now()}.csv`)
  }, [])

  const exportToPDF = useCallback(() => {
    const lines = [
      'Analytics Report',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'Monthly Waste Data',
      '-'.repeat(40),
      'Month    Plastic  Metal  Glass',
      '-'.repeat(40),
      ...MONTHLY_DATA.map((d) =>
        `${d.month.padEnd(9)}${String(d.plastic).padEnd(9)}${String(d.metal).padEnd(7)}${d.glass}`
      ),
      '-'.repeat(40),
      '',
      'Summary',
      `Total entries: ${MONTHLY_DATA.length}`,
      `Avg Plastic: ${Math.round(MONTHLY_DATA.reduce((s, d) => s + d.plastic, 0) / MONTHLY_DATA.length)}%`,
      `Avg Metal: ${Math.round(MONTHLY_DATA.reduce((s, d) => s + d.metal, 0) / MONTHLY_DATA.length)}%`,
      `Avg Glass: ${Math.round(MONTHLY_DATA.reduce((s, d) => s + d.glass, 0) / MONTHLY_DATA.length)}%`,
    ]
    // Export as plain text (PDF library would be added in production)
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), `analytics-${Date.now()}.txt`)
  }, [])

  return { exportToCSV, exportToPDF }
}
