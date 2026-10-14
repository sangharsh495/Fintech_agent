"use client"

import { useEffect, useState } from "react"
import {
  Sparkles,
  ShieldCheck,
  Building2,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LaunchScreenProps {
  onComplete: () => void
}

// Short, honest welcome copy: the splash is a brand moment, not a real
// progress indicator, so it must not claim work that is not happening.
const loadingSteps = [
  { text: "Opening your secure workspace...", icon: ShieldCheck },
  { text: "Bank statements, in one place", icon: Building2 },
  { text: "Spending insights and tax planning", icon: TrendingUp },
  { text: "Ready", icon: Sparkles },
]

export default function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // A brief intro; it used to hold the whole app hostage for 10 seconds.
    const duration = 2000
    const intervalTime = 100
    const increment = 100 / (duration / intervalTime)

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(timer)
          handleExit()
          return 100
        }
        return next
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [])

  // Rotate loading steps every 1.25 seconds
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 500)

    return () => clearInterval(stepTimer)
  }, [])

  const handleExit = () => {
    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 800) // Matches transition-all duration
  }

  const ActiveIcon = loadingSteps[currentStep].icon

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] bg-[#0c0f16] flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden transition-all duration-800 ease-in-out",
        isExiting ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      {/* Decorative Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[150px] pointer-events-none opacity-40 mix-blend-screen animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/20 rounded-full blur-[150px] pointer-events-none opacity-30 mix-blend-screen animate-pulse" />

      {/* Top spacing */}
      <div className="w-full flex justify-between items-center z-10">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono">
          FinFlow
        </span>
      </div>

      {/* Central Brand Logo & Intro */}
      <div className="flex flex-col items-center justify-center text-center max-w-lg z-10 flex-1">
        
        {/* Glowing Logo Wrap */}
        <div className="relative w-24 h-24 mb-8 group">
          <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-xl group-hover:scale-110 transition-transform duration-500" />
          <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl animate-in spin-in-12 duration-1000">
            <TrendingUp className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight mb-3 text-white">
          Fin<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Flow</span>
        </h1>
        
        <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed mb-10">
          Consolidating bank balances, tracking spending behavior, and optimizing tax returns in one workspace.
        </p>

        {/* Spacing container for loader */}
        <div className="w-full max-w-xs space-y-4">
          
          {/* Progress Bar Container */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 font-mono">
            <span>Welcome</span>
            <span className="font-bold tabular-nums text-white">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Dynamic Logger & Skip button */}
      <div className="w-full max-w-md flex flex-col md:flex-row items-center justify-between gap-6 z-10 pb-6 md:pb-0">
        
        {/* Dynamic Activity Log */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl w-full md:w-auto min-w-[280px]">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ActiveIcon className="w-4.5 h-4.5 animate-bounce" />
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">FinFlow</p>
            <p className="text-xs font-semibold text-white truncate max-w-[210px] animate-in fade-in slide-in-from-bottom-2 duration-300">
              {loadingSteps[currentStep].text}
            </p>
          </div>
        </div>

        {/* Skip button with 44x44 WCAG Touch Target */}
        <button
          onClick={handleExit}
          className="group inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all hover:scale-105 active:scale-95 touch-target-comfortable"
        >
          Skip Intro
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>
      </div>

    </div>
  )
}
