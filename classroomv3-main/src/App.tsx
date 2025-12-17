import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlayColoring from './pages/Student/PlayColoring'
import PlayPuzzle from './pages/Student/PlayPuzzle'
import PlayCategory from './pages/Student/PlayCategory'
import Dashboard from './pages/Teacher/Dashboard'
import StudentEvaluation from './pages/Teacher/StudentEvaluation'
import './App.css'

function App() {
  return (
    <BrowserRouter basename="/studio/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/coloring" element={<PlayColoring />} />
        <Route path="/puzzle" element={<PlayPuzzle />} />
        <Route path="/category" element={<PlayCategory />} />
        <Route path="/teacher" element={<Dashboard />} />
        <Route path="/teacher/evaluation" element={<StudentEvaluation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
