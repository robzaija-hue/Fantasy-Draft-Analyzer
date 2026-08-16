import { useState, useMemo, useCallback } from 'react'
import { parseWorkbook, flattenTeams } from '../utils/parseExcel'
import { buildDataModel } from '../utils/analysis'

/**
 * Manages all state for a single sport: file upload, sheet selection,
 * parsed data model, and sub-tab selections (player, team).
 */
export function useSportState(sportKey) {
  const [rawRows, setRawRows] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [sheets, setSheets] = useState({})
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  const dataModel = useMemo(() => {
    if (rawRows.length === 0) return null
    return buildDataModel(rawRows)
  }, [rawRows])

  const handleFile = useCallback(
    async (file) => {
      if (!file) return
      setFileName(file.name)
      try {
        const { sheetNames: names, sheets: parsed } = await parseWorkbook(
          file,
          sportKey,
        )
        setSheetNames(names)
        setSheets(parsed)

        const config = sportKey === 'football' ? 'Football Fantasy Drafts' : names[0]
        const defaultSheet = names.includes(config) ? config : names[0]

        setSelectedSheet(defaultSheet)
        const teams = parsed[defaultSheet] || []
        const rows = flattenTeams(teams)
        setRawRows(rows)
        setHasData(rows.length > 0)
        setError(null)

        const model = buildDataModel(rows)
        if (model.uniquePlayers.length > 0) {
          setSelectedPlayer(model.uniquePlayers[0])
        }
        if (model.teamNames.length > 0) {
          setSelectedTeam(model.teamNames[0])
        }
      } catch (e) {
        setError(e.message)
        setHasData(false)
      }
    },
    [sportKey],
  )

  const handleSheetChange = useCallback(
    (sheetName) => {
      setSelectedSheet(sheetName)
      const teams = sheets[sheetName] || []
      const rows = flattenTeams(teams)
      setRawRows(rows)
      setHasData(rows.length > 0)

      const model = buildDataModel(rows)
      if (model.uniquePlayers.length > 0) {
        setSelectedPlayer(model.uniquePlayers[0])
      }
      if (model.teamNames.length > 0) {
        setSelectedTeam(model.teamNames[0])
      }
    },
    [sheets],
  )

  const handleClear = useCallback(() => {
    setRawRows([])
    setSelectedSheet('')
    setHasData(false)
    setError(null)
    setFileName('')
    setSheetNames([])
    setSheets({})
    setSelectedPlayer('')
    setSelectedTeam('')
  }, [])

  return {
    rawRows,
    selectedSheet,
    hasData,
    error,
    fileName,
    sheetNames,
    selectedPlayer,
    selectedTeam,
    dataModel,
    handleFile,
    handleSheetChange,
    handleClear,
    setSelectedPlayer,
    setSelectedTeam,
  }
}
