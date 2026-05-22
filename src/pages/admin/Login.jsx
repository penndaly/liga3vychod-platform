import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      toast.error('Nesprávny email alebo heslo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-yellow-400 font-black text-xl tracking-widest uppercase">TIPOS III.</span>
          <span className="text-white font-bold text-xl tracking-wide uppercase ml-2">Liga Východ</span>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest">Admin prístup</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              placeholder="admin@liga.sk"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Heslo
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-slate-950 font-black uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mt-2"
          >
            {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
          </button>
        </form>
      </div>
    </div>
  )
}
