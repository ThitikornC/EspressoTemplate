import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Info, X, Mic, MicOff, CheckCircle } from 'lucide-react';

const BoxBreathingApp: React.FC = () => {
  // สถานะหลักของแอป
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'idle'|'inhale'|'hold-in'|'exhale'|'hold-out'|'completed'>('idle');
  const [timer, setTimer] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);
  
  // การตั้งค่า
  const [duration, setDuration] = useState<number>(4); // ค่ามาตรฐาน 4 วินาที
  const [targetCycles, setTargetCycles] = useState<number>(0); // 0 = ไม่จำกัด
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); // เสียง Beep
  const [voiceEnabled, setVoiceEnabled] = useState(false); // เสียงพูดนำจังหวะ

  // References
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<any>(null);

  // ข้อความสำหรับแต่ละระยะ (ภาษาไทย)
  const phaseConfig: Record<string, any> = {
    idle: { 
      text: 'พร้อมแล้วกดเริ่ม', 
      instruction: 'เตรียมตัวให้ผ่อนคลาย',
      color: 'text-slate-500',
      scale: 'scale-100',
      ringColor: 'border-slate-200'
    },
    inhale: { 
      text: 'หายใจเข้า', 
      instruction: 'สูดลมหายใจเข้าลึกๆ ผ่านจมูก',
      color: 'text-teal-600',
      scale: 'scale-150', // ขยายออก
      ringColor: 'border-teal-400'
    },
    'hold-in': { 
      text: 'กลั้นหายใจ', 
      instruction: 'เก็บลมหายใจไว้ในปอด',
      color: 'text-indigo-600',
      scale: 'scale-150', // ค้างไว้ที่ขนาดใหญ่
      ringColor: 'border-indigo-400'
    },
    exhale: { 
      text: 'หายใจออก', 
      instruction: 'ปล่อยลมหายใจออกทางปากช้าๆ',
      color: 'text-sky-600',
      scale: 'scale-100', // หดลง
      ringColor: 'border-sky-400'
    },
    'hold-out': { 
      text: 'กลั้นหายใจ', 
      instruction: 'ปล่อยปอดให้ว่าง พักไว้',
      color: 'text-indigo-600',
      scale: 'scale-100', // ค้างไว้ที่ขนาดเล็ก
      ringColor: 'border-indigo-400'
    },
    completed: {
      text: 'ยอดเยี่ยม!',
      instruction: 'คุณทำครบตามเป้าหมายแล้ว',
      color: 'text-emerald-500',
      scale: 'scale-110',
      ringColor: 'border-emerald-400'
    }
  };

  // ฟังก์ชันอ่านออกเสียง (Text-to-Speech)
  const speak = (text: string) => {
    if (!voiceEnabled) return;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ฟังก์ชันสร้างเสียง Beep
  const playSound = (freq = 440, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // ฟังก์ชันเริ่มจับเวลา
  const startTimer = () => {
    if (phase === 'completed') {
      // ถ้ากดเริ่มจากหน้าจบ ให้รีเซ็ตก่อน
      resetTimer();
      setTimeout(() => {
        setIsActive(true);
        setPhase('inhale');
        setTimer(duration);
        playSound(300);
        if (voiceEnabled) speak(phaseConfig['inhale'].text);
      }, 100);
      return;
    }

    setIsActive(true);
    if (phase === 'idle') {
      setPhase('inhale');
      setTimer(duration);
      playSound(300); 
      if (voiceEnabled) speak(phaseConfig['inhale'].text);
    }
  };

  // ฟังก์ชันหยุดชั่วคราว
  const pauseTimer = () => {
    setIsActive(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  // ฟังก์ชันรีเซ็ต
  const resetTimer = () => {
    setIsActive(false);
    setPhase('idle');
    setTimer(duration);
    setCycleCount(0);
    if (intervalRef.current) window.clearInterval(intervalRef.current as number);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  // Loop หลักของ Timer
  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            handlePhaseChange();
            return duration;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) window.clearInterval(intervalRef.current as number);
    }

    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current as number); };
  }, [isActive, phase, duration, voiceEnabled, targetCycles, cycleCount]); 

  // จัดการการเปลี่ยน Phase
  const handlePhaseChange = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    playSound(440); 

    setPhase((current) => {
      let nextPhase: typeof phase = 'idle';
      let shouldIncrementCycle = false;

      switch (current) {
        case 'inhale': nextPhase = 'hold-in'; break;
        case 'hold-in': nextPhase = 'exhale'; break;
        case 'exhale': nextPhase = 'hold-out'; break;
        case 'hold-out': 
          // ตรวจสอบว่าครบกำหนดหรือยัง
          if (targetCycles > 0 && cycleCount + 1 >= targetCycles) {
            nextPhase = 'completed';
            setIsActive(false);
            if (voiceEnabled) speak("ยอดเยี่ยม คุณทำครบตามเป้าหมายแล้ว");
          } else {
            nextPhase = 'inhale'; 
          }
          shouldIncrementCycle = true;
          break;
        default: nextPhase = 'idle';
      }

      if (voiceEnabled && nextPhase !== 'completed' && phaseConfig[nextPhase]) {
        speak(phaseConfig[nextPhase].text);
      }
      
      if (shouldIncrementCycle) {
        setCycleCount(c => c + 1);
      }

      return nextPhase;
    });
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((timer / duration) * circumference);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden text-slate-800">
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <h1 className="text-xl font-bold text-slate-700 hidden sm:block">Box Breathing</h1>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${voiceEnabled ? 'text-teal-600 bg-teal-50' : 'text-slate-400'}`}
            title="เปิด/ปิดเสียงพูดนำ"
          >
            {voiceEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${soundEnabled ? 'text-slate-600' : 'text-slate-400'}`}
            title="เปิด/ปิดเสียง Effect"
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          
          <button 
            onClick={() => setShowInfo(true)}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600"
            title="วิธีใช้"
          >
            <Info size={24} />
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${showSettings ? 'text-teal-600 bg-teal-50' : 'text-slate-600'}`}
            title="ตั้งค่า"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center relative w-full max-w-md">
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-16 bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm z-20 animate-fade-in-down border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-700">ตั้งค่า</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            {/* Duration Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 font-medium">ความยาวต่อจังหวะ</span>
                <span className="font-bold text-teal-600 text-lg">{duration} วินาที</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="10" 
                value={duration} 
                onChange={(e) => {
                  setDuration(parseInt(e.target.value));
                  resetTimer();
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>3 (เร็ว)</span>
                <span>10 (ช้า)</span>
              </div>
            </div>

            {/* Target Cycles Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 font-medium">จำนวนรอบเป้าหมาย</span>
                <span className="font-bold text-indigo-600 text-lg">
                  {targetCycles === 0 ? "ไม่จำกัด" : `${targetCycles} รอบ`}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={targetCycles} 
                onChange={(e) => {
                  setTargetCycles(parseInt(e.target.value));
                  if (isActive) resetTimer();
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>∞</span>
                <span>20 รอบ</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400 text-center">
              * การเปลี่ยนค่าจะรีเซ็ตการนับรอบปัจจุบัน
            </div>
          </div>
        )}

        {/* Visualizer */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
          
          {/* Background Box */}
          <div className="absolute w-64 h-64 border-2 border-slate-100 rounded-3xl transform rotate-45 opacity-50"></div>
          
          {/* Progress Ring */}
          <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-100"
            />
            {phase !== 'idle' && phase !== 'completed' && (
              <circle
                cx="150"
                cy="150"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-linear ${phaseConfig[phase].color.replace('text', 'text')}`}
              />
            )}
            {phase === 'completed' && (
               <circle
               cx="150"
               cy="150"
               r={radius}
               stroke="currentColor"
               strokeWidth="8"
               fill="transparent"
               className="text-emerald-400"
             />
            )}
          </svg>

          {/* Center Circle (The "Lung" or "Status") */}
          <div 
            className={`
              w-32 h-32 rounded-full shadow-lg opacity-90
              flex items-center justify-center backdrop-blur-sm
              transition-all ease-in-out
              ${phaseConfig[phase].scale}
              ${phase === 'idle' ? 'bg-slate-200' : 
                phase === 'inhale' ? 'bg-teal-400 shadow-teal-200' :
                phase === 'hold-in' ? 'bg-indigo-400 shadow-indigo-200' :
                phase === 'exhale' ? 'bg-sky-400 shadow-sky-200' :
                phase === 'hold-out' ? 'bg-indigo-300 shadow-indigo-100' :
                'bg-emerald-100 shadow-emerald-200' // completed
              }
            `}
            style={{ transitionDuration: isActive ? `${duration}s` : '0.5s' }}
          >
            {/* Display Logic */}
            {phase === 'idle' && (
              <span className="text-4xl font-bold text-slate-400 drop-shadow-md">
                <Play fill="currentColor" />
              </span>
            )}
            
            {phase === 'completed' && (
              <span className="text-emerald-500 animate-bounce">
                <CheckCircle size={48} />
              </span>
            )}

            {phase !== 'idle' && phase !== 'completed' && (
              <span className="text-4xl font-bold text-white drop-shadow-md">
                {timer}
              </span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center h-24 mb-6">
          <h2 className={`text-3xl font-bold mb-2 transition-colors duration-500 ${phaseConfig[phase].color}`}>
            {phaseConfig[phase].text}
          </h2>
          <p className="text-slate-500 text-lg">
            {phaseConfig[phase].instruction}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-6 items-center">
          {!isActive && phase !== 'completed' ? (
            <button 
              onClick={startTimer}
              className="w-16 h-16 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Play size={32} fill="currentColor" className="ml-1" />
            </button>
          ) : isActive ? (
            <button 
              onClick={pauseTimer}
              className="w-16 h-16 bg-amber-400 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Pause size={32} fill="currentColor" />
            </button>
          ) : (
            // Completed state - Replay button
             <button 
              onClick={startTimer}
              className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <RotateCcw size={32} className="" />
            </button>
          )}

          <button 
            onClick={resetTimer}
            className="w-12 h-12 bg-white text-slate-400 hover:text-slate-600 border-2 border-slate-200 hover:border-slate-300 rounded-full flex items-center justify-center transition-all"
            disabled={phase === 'idle'}
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Cycle Counter with Target */}
        <div className="mt-8 text-slate-400 font-medium flex flex-col items-center">
          <div className="flex items-center gap-2">
             <span>จำนวนรอบ:</span>
             <span className="text-slate-600 font-bold text-lg">{cycleCount}</span>
             {targetCycles > 0 && (
               <>
                 <span className="text-slate-300">/</span>
                 <span className="text-indigo-400 font-bold">{targetCycles}</span>
               </>
             )}
          </div>
          {targetCycles > 0 && (
            <div className="w-32 h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
               <div 
                 className="h-full bg-indigo-400 transition-all duration-500"
                 style={{ width: `${Math.min((cycleCount / targetCycles) * 100, 100)}%` }}
               ></div>
            </div>
          )}
        </div>

      </main>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">การหายใจแบบกล่อง</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Box Breathing เป็นเทคนิคการหายใจเพื่อลดความเครียด
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <span className="text-slate-700">1. หายใจเข้า 4 วินาที</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-slate-700">2. กลั้นหายใจ 4 วินาที</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <span className="text-slate-700">3. หายใจออก 4 วินาที</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-slate-700">4. กลั้นหายใจ 4 วินาที</span>
              </div>
            </div>
            <button 
              onClick={() => setShowInfo(false)}
              className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default BoxBreathingApp;
