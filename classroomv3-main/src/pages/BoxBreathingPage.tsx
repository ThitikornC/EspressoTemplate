import React from 'react'
import BoxBreathingApp from './BoxBreathingApp'

const BoxBreathingPage: React.FC = () => {
  return (
    <div className="box-breathing-page min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <BoxBreathingApp />
      </div>
    </div>
  )
}

export default BoxBreathingPage
