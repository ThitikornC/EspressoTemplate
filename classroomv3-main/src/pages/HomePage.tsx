import React from 'react'
import { Link } from 'react-router-dom'
import { GameConfig } from '../services/storage'
import BoxBreathingApp from './BoxBreathingApp'

// Default games configuration - always shown
const defaultGameConfig: GameConfig[] = [
  {
    id: 'coloring',
    name: 'ระบายสี',
    icon: '🎨',
    description: 'สนุกกับการวาดและระบายสีด้วยนิ้ว หรือปากกาสไตลัส',
    path: '/coloring',
    enabled: true,
    order: 1
  },
  {
    id: 'puzzle',
    name: 'จิ๊กซอว์',
    icon: '🧩',
    description: 'ต่อภาพจิ๊กซอว์สนุก ๆ ลากวางชิ้นส่วนให้ถูกที่',
    path: '/puzzle',
    enabled: true,
    order: 2
  },
  {
    id: 'category',
    name: 'จัดหมวดหมู่',
    icon: '🗂️',
    description: 'ลากรายการไปจัดเข้าหมวดหมู่ที่ถูกต้อง',
    path: '/category',
    enabled: true,
    order: 3
  }
]

function HomePage() {

  return (
    <div className="home-page">
      <h1 className="home-title">🎨 สตูดิโอห้องเรียนมหาสนุก 🎮</h1>
      
      <div className="game-cards">
        {defaultGameConfig.map(tile => (
          <Link key={tile.id} to={tile.path} className="game-card">
            <div className="game-icon">{tile.icon}</div>
            <h2>{tile.name}</h2>
            <p>{tile.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Relaxation Tools</h3>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <BoxBreathingApp />
        </div>
      </div>
    </div>
  )
}

export default HomePage
