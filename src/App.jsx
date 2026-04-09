import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useTheme } from './context/ThemeContext'

import Login from './pages/Login'
import JoinWorkspace from './pages/JoinWorkspace'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Rooms from './pages/Rooms'
import Guests from './pages/Guests'
import GuestDetail from './pages/GuestDetail'
import CurrentGuests from './pages/CurrentGuests'
import FoodManagement from './pages/FoodManagement'
import Billing from './pages/Billing'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function AppRoutes() {
  const { dark } = useTheme()
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            background: dark ? '#1C2030' : '#ffffff',
            color: dark ? '#f0f0f4' : '#1a1d2e',
            border: `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
          },
          success: { iconTheme: { primary: '#22c55e', secondary: dark ? '#1C2030' : 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: dark ? '#1C2030' : 'white' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<JoinWorkspace />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="guests" element={<Guests />} />
          <Route path="guests/:id" element={<GuestDetail />} />
          <Route path="current" element={<CurrentGuests />} />
          <Route path="booking/:id/food" element={<FoodManagement />} />
          <Route path="billing/:bookingId" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}
