import { useContext } from 'react'
import { ConjoinThemeContext } from '../provider/contexts'

export function useConjoinTheme() {
  const context = useContext(ConjoinThemeContext)
  if (!context) {
    throw new Error('useConjoinTheme must be used within a ConjoinProvider')
  }
  return context
}
