import { useState, useCallback } from "react"
import { parseCSV } from "../lib/parseCSV"
import type { Recipient } from "../lib/parseCSV"

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRecipients(parseCSV(text))
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) loadFile(file)
    },
    [loadFile]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadFile(file)
    },
    [loadFile]
  )

  const validRecipients = recipients.filter((r) => r.valid)
  const invalidCount = recipients.filter((r) => !r.valid).length

  return {
    recipients,
    validRecipients,
    invalidCount,
    isDragging,
    setIsDragging,
    onDrop,
    onFileChange,
  }
}
