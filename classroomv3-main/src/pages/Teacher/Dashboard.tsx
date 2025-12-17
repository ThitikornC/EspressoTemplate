import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👩‍🏫 จัดการห้องเรียน</h1>
        <button className="back-btn" onClick={() => window.history.back()}>
          ← กลับหน้าหลัก
        </button>
      </div>

      {/* Advanced Management Links */}
      <div className="management-links">
        <h3>🛠️ การจัดการขั้นสูง</h3>
        <div className="links-grid">
          <button className="link-card" onClick={() => navigate('/teacher/evaluation')}>
            <span className="icon">📋</span>
            <span className="title">ประเมินพฤติกรรมนักเรียน</span>
            <span className="desc">กรอกตารางประเมิน</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
