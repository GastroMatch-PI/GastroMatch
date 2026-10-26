import { Link } from 'react-router-dom'

export default function NotFound({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-2xl sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-soft">{text}</p>
      <Link to="/" className="btn btn-primary mt-8">
        Voltar para o início
      </Link>
    </div>
  )
}
