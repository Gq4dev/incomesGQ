import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PrivacyProvider } from '@/hooks/usePrivacyMode'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthGuard } from '@/src/components/auth/AuthGuard'
import LoginPage from '@/src/pages/LoginPage'
import DashboardPage from '@/src/pages/DashboardPage'
import IncomePage from '@/src/pages/IncomePage'
import NewIncomePage from '@/src/pages/NewIncomePage'
import ExpensesPage from '@/src/pages/ExpensesPage'
import NewExpensePage from '@/src/pages/NewExpensePage'
import ProvidersPage from '@/src/pages/ProvidersPage'

export default function App() {
  return (
    <PrivacyProvider>
      <BrowserRouter>
        <TopBar />
        <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-8">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AuthGuard />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/income/new" element={<NewIncomePage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/new" element={<NewExpensePage />} />
              <Route path="/providers" element={<ProvidersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </BrowserRouter>
    </PrivacyProvider>
  )
}
