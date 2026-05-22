import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function fetchCollection(collectionName, constraints = []) {
  const ref = collection(db, collectionName)
  const q = constraints.length ? query(ref, ...constraints) : ref
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchDocument(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateDocument(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id))
}

export { orderBy, where, query, collection }
