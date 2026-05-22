import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { fetchCollection } from '../services/api'

export function useCollection(collectionName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCollection(collectionName)
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e); setLoading(false) })
  }, [collectionName])

  return { data, loading, error }
}

// Real-time listener — use for live match scores
export function useLiveCollection(collectionName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = collection(db, collectionName)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsubscribe
  }, [collectionName])

  return { data, loading }
}
