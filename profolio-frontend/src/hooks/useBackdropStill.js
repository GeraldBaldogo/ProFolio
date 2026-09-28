import { useEffect } from 'react'

/*
 * Freezes the background aurora and glitter while `still` is true.
 *
 * Assessment pages call this with "the timed part is running", so the
 * backdrop moves on the setup and results screens but holds perfectly still
 * while a student is answering. It keeps its colour — it just stops moving.
 *
 * Works through an attribute on <html> that AmbientBackdrop watches, so no
 * context or props need threading through the app.
 */
export function useBackdropStill(still) {
  useEffect(() => {
    if (!still) return
    const root = document.documentElement
    root.setAttribute('data-fx-still', '')
    return () => root.removeAttribute('data-fx-still')
  }, [still])
}