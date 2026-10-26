import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import NotFound from './components/NotFound'
import Directory from './pages/Directory'
import Home from './pages/Home'
import Portal from './pages/Portal'
import Recipe from './pages/Recipe'

// Volta ao topo a cada página e rola até a âncora (#secao) quando existir.
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Header />
      <main className="wrap flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profissionais" element={<Directory />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/receita/:id" element={<Recipe />} />
          <Route
            path="*"
            element={<NotFound title="Página não encontrada" text="O endereço pode estar errado ou a página foi movida." />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
