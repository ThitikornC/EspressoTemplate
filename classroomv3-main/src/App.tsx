import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlayColoring from './pages/Student/PlayColoring'
import PlayPuzzle from './pages/Student/PlayPuzzle'
import PlayCategory from './pages/Student/PlayCategory'
import { useUsageTracking, useSocketHeartbeat } from './hooks/useUsageTracking'
import './App.css'
import './pages/pages-theme.css'

// Component to handle tracking inside BrowserRouter
function AppRoutes() {
  // Track usage for each page
  useUsageTracking()
  // Socket heartbeat for active user tracking
  useSocketHeartbeat()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/coloring" element={<PlayColoring />} />
      <Route path="/puzzle" element={<PlayPuzzle />} />
      <Route path="/category" element={<PlayCategory />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter basename="/studio/">
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
