import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

export async function markMatchComplete(matchId) {
  const fixtureRef = doc(db, 'fixtures', matchId)
  const fixtureSnap = await getDoc(fixtureRef)

  if (!fixtureSnap.exists()) throw new Error('Match not found')

  const matchData = fixtureSnap.data()

  await setDoc(doc(db, 'results', matchId), {
    ...matchData,
    status: 'complete',
    completedAt: serverTimestamp(),
  })

  await deleteDoc(fixtureRef)

  return true
}
