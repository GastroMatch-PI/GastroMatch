import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import Directory from './pages/Directory'
import Home from './pages/Home'
import Portal from './pages/Portal'
import Recipe from './pages/Recipe'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Onboarding from './pages/Onboarding'
import PublicarReceita from './pages/PublicarReceita'
import Favoritos from './pages/Favoritos'
import Conta from './pages/Conta'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profissionais" element={<Directory />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/receita/:id" element={<Recipe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/publicar" element={<PublicarReceita />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
