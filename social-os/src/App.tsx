import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { Home } from './pages/Home'
import { MyDay } from './pages/MyDay'
import { Contents } from './pages/Contents'
import { Calendar } from './pages/Calendar'
import { Ideas } from './pages/Ideas'
import { Tasks } from './pages/Tasks'
import { Dates } from './pages/Dates'
import { Clients } from './pages/Clients'
import { Settings } from './pages/Settings'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Central de Operação',
  '/meu-dia': 'Meu Dia',
  '/conteudos': 'Banco de Conteúdos',
  '/calendario': 'Calendário Editorial',
  '/ideias': 'Banco de Ideias',
  '/tarefas': 'Tarefas Gerais',
  '/radar': 'Radar de Datas',
  '/clientes': 'Clientes',
  '/configuracoes': 'Configurações',
}

function Layout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Social OS'
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} />
        <main style={{ flex: 1, padding: 28, overflowY: 'auto', background: 'var(--surface)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meu-dia" element={<MyDay />} />
            <Route path="/conteudos" element={<Contents />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/ideias" element={<Ideas />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/radar" element={<Dates />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
