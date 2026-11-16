import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import {
  Blocked,
  Home,
  Loading,
  Login,
  NoProfile,
  Pending,
  Register,
  Rejected,
  Verify,
  Welcome,
} from './pages'

export default function App() {
  const { loading, session, profile } = useAuth()

  if (loading) return <Loading />

  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!profile) return <NoProfile />

  // الحالة تُقرَّر من قاعدة البيانات، والواجهة هنا للعرض فقط
  switch (profile.status) {
    case 'pending':
      return <Pending />
    case 'rejected':
      return <Rejected />
    case 'suspended':
    case 'disabled':
      return <Blocked />
    case 'active':
      return (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )
  }
}
