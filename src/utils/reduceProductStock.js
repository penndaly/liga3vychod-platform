import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

/**
 * Reduces stock for every item in the order.
 * Handles both flat numeric stock and size-keyed stock objects.
 * Clamps at 0 — never goes negative.
 *
 * @param {string} orderId
 * @param {string} clubId  – numeric club id as a string (e.g. "7")
 */
export async function reduceProductStock(orderId, clubId) {
  const orderSnap = await getDoc(doc(db, 'clubs', clubId, 'orders', orderId))
  if (!orderSnap.exists()) throw new Error(`Order ${orderId} not found`)

  const order = orderSnap.data()

  for (const item of order.items ?? []) {
    if (!item.productId) continue

    const productRef  = doc(db, 'clubs', clubId, 'products', item.productId)
    const productSnap = await getDoc(productRef)
    if (!productSnap.exists()) continue

    const product = productSnap.data()
    const qty     = item.quantity ?? 1

    if (item.size && product.stock && typeof product.stock === 'object') {
      // Size-keyed stock: { XS: 5, S: 10, M: 3, … }
      const current = Number(product.stock[item.size]) || 0
      await updateDoc(productRef, {
        [`stock.${item.size}`]: Math.max(0, current - qty),
      })
    } else if (typeof product.stock === 'number') {
      // Flat numeric stock
      await updateDoc(productRef, {
        stock: Math.max(0, product.stock - qty),
      })
    }
    // If stock field is missing we skip silently — product may not track stock
  }
}
