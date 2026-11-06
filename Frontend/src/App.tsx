import { Route } from 'react-router-dom'
import { AcessoNegado, NotFound } from './components/Erros'
import Footer from './components/Footer'
import Header from './components/Header'
import { PageTransition } from './components/Motion'
import Admin from './pages/Admin'
import Cadastro from './pages/Cadastro'
import Chef from './pages/Chef'
import Conta from './pages/Conta'
import Directory from './pages/Directory'
import Favoritos from './pages/Favoritos'
import Home from './pages/Home'
import Login from './pages/Login'
import NovaReceita from './pages/NovaReceita'
import Onboarding from './pages/Onboarding'
import Painel from './pages/Painel'
import Perfil from './pages/Perfil'
import Portal from './pages/Portal'
import Receitas from './pages/Receitas'
import Recipe from './pages/Recipe'
import Restaurante from './pages/Restaurante'
import Restaurantes from './pages/Restaurantes'
import Senha from './pages/Senha'
import Verificacao from './pages/Verificacao'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 outline-none">
        <PageTransition>
          <Route path="/" element={<Home />} />
          <Route path="/receitas" element={<Receitas />} />
          <Route path="/receita/:id" element={<Recipe />} />
          <Route path="/receita/:id/editar" element={<NovaReceita />} />
          <Route path="/publicar" element={<NovaReceita />} />
          <Route path="/painel" element={<Painel />} />
          <Route path="/profissionais" element={<Directory />} />
          <Route path="/restaurantes" element={<Restaurantes />} />
          <Route path="/restaurante/:id" element={<Restaurante />} />
          <Route path="/chef/:id" element={<Chef />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/senha" element={<Senha />} />
          <Route path="/verificacao" element={<Verificacao />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/acesso-negado" element={<AcessoNegado />} />
          <Route path="*" element={<NotFound />} />
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
