import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="text-lg font-semibold tracking-tight text-ink">
      Gastro<span className="text-brand">Match</span>
    </Link>
  )
}
