import { useState, useRef, useEffect, useCallback } from 'react'

const BG_IMAGE_1 = `${import.meta.env.BASE_URL}images/exterior.jpg`
const BG_IMAGE_2 = `${import.meta.env.BASE_URL}images/cross-section.jpg`

const SPOTLIGHT_R = 260

const navItems = ['Products', 'Technology', 'Specs', 'Pricing', 'Live Demo']

function RevealLayer({
  image,
  cursorX,
  cursorY,
}: {
  image: string
  cursorX: number
  cursorY: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      SPOTLIGHT_R
    )
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2)
    ctx.fill()

    const dataUrl = canvas.toDataURL()
    const revealEl = document.getElementById('reveal-layer')
    if (revealEl) {
      revealEl.style.maskImage = `url(${dataUrl})`
      revealEl.style.webkitMaskImage = `url(${dataUrl})`
      revealEl.style.maskSize = '100% 100%'
      revealEl.style.webkitMaskSize = '100% 100%'
    }
  }, [cursorX, cursorY])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      <div
        id="reveal-layer"
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
      />
    </>
  )
}

function App() {
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>(0)

  const animate = useCallback(() => {
    smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
    smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
    setCursorPos({ x: smooth.current.x, y: smooth.current.y })
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  return (
    <div
      className="min-h-screen bg-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh' }}
      >
        {/* Base Image */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Reveal Layer */}
        <RevealLayer
          image={BG_IMAGE_2}
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
        />

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
          {/* Left: Logo + Wordmark */}
          <div className="flex items-center gap-2">
            <svg
              width="26"
              height="26"
              viewBox="0 0 256 256"
              fill="#ffffff"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
            <span className="text-white text-2xl font-playfair italic">
              THERMOS
            </span>
          </div>

          {/* Center Pill */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
            {navItems.map((item, i) => (
              <button
                key={item}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  i === 0
                    ? 'text-white'
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Right: Sign Up */}
          <button className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
            Sign Up
          </button>

          {/* Mobile Hamburger */}
          <button className="md:hidden flex flex-col gap-1.5">
            <div className="w-5 h-0.5 bg-white" />
            <div className="w-5 h-0.5 bg-white" />
            <div className="w-5 h-0.5 bg-white" />
          </button>
        </nav>

        {/* Heading */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
            >
              Behind the
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              shell lies innovation
            </span>
          </h1>
        </div>

        {/* Bottom-left paragraph */}
        <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade" style={{ animationDelay: '0.7s' }}>
          <p className="text-sm text-white/80 leading-relaxed">
            Every bottle is engineered with precision — double-wall vacuum
            insulation keeps your drink at the perfect temperature for hours.
          </p>
        </div>

        {/* Bottom-right block */}
        <div className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Move your cursor across the bottle to reveal the engineering inside. Our
            interactive experience lets you see beyond the shell to the technology
            that keeps it working.
          </p>
          <button className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30">
            Explore the Tech
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
