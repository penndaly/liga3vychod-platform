import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, query, orderBy,
  doc, deleteDoc, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { db } from '../services/firebase'
import { getClubBySlug } from '../config/clubs-config'

export function useProducts(clubSlug) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  const staticClub = getClubBySlug(clubSlug)
  const clubId     = staticClub ? String(staticClub.id) : null

  useEffect(() => {
    if (!clubId) return
    const unsub = onSnapshot(
      query(collection(db, 'clubs', clubId, 'products'), orderBy('createdAt', 'desc')),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [clubId])

  async function deleteProduct(productId) {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Odstrániť tento produkt?')) return
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'products', productId))
      toast.success('Produkt vymazaný')
    } catch {
      toast.error('Chyba pri mazaní')
    }
  }

  async function toggleActive(productId, current) {
    try {
      await updateDoc(doc(db, 'clubs', clubId, 'products', productId), {
        active: !current, updatedAt: serverTimestamp(),
      })
    } catch {
      toast.error('Chyba pri zmene stavu')
    }
  }

  async function duplicateProduct(product) {
    try {
      const { id, createdAt, updatedAt, ...rest } = product
      await addDoc(collection(db, 'clubs', clubId, 'products'), {
        ...rest,
        name:    `${rest.name} (kópia)`,
        name_en: rest.name_en ? `${rest.name_en} (copy)` : '',
        active:  false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Produkt duplikovaný')
    } catch {
      toast.error('Chyba pri duplikovaní')
    }
  }

  return { products, loading, clubId, deleteProduct, toggleActive, duplicateProduct }
}

// Derived helpers used by components
export function totalStock(stock) {
  if (!stock) return 0
  if (typeof stock === 'number') return stock
  return Object.values(stock).reduce((s, v) => s + (Number(v) || 0), 0)
}

export function stockStatus(total) {
  if (total === 0) return 'out'
  if (total <= 10) return 'low'
  return 'ok'
}
