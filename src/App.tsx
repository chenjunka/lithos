import { useState, useRef, useEffect, useCallback } from 'react'

const BG_IMAGE_1 = `${import.meta.env.BASE_URL}images/exterior.jpg`
const BG_IMAGE_2 = `${import.meta.env.BASE_URL}images/cross-section.jpg`

const ZION_PROJECT_ID = '9G6nZlvVVym'
const ZION_GRAPHQL_URL = `https://zion-app.functorz.com/zero/${ZION_PROJECT_ID}/api/graphql-v2`
const DESKTOP_SPOTLIGHT_R = 260
const MOBILE_BREAKPOINT = 640

const navItems = ['Products', 'Technology', 'Specs', 'Pricing', 'Live Demo']

type ZionImage = {
  id: number
  url: string
}

type ProductHero = {
  id: number
  product_name: string | null
  product_subtitle: string | null
  detail_text: string | null
  purchase_notes: string | null
  ud_shangcengtu_64875d: ZionImage | null
  ud_toushitu_50a670: ZionImage | null
}

type ProductHeroState = {
  data: ProductHero | null
  loading: boolean
  error: string | null
}

const PRODUCT_HERO_QUERY = `
  query GetProductHero($id: bigint!) {
    product_by_pk(id: $id) {
      id
      product_name
      product_subtitle
      detail_text
      purchase_notes
      ud_shangcengtu_64875d { id url }
      ud_toushitu_50a670 { id url }
    }
  }
`

function getProductIdFromUrl() {
  if (typeof window === 'undefined') return 3
  const params = new URLSearchParams(window.location.search)
  const rawId = params.get('int') ?? params.get('id') ?? '3'
  const productId = Number.parseInt(rawId, 10)
  return Number.isFinite(productId) && productId > 0 ? productId : 3
}

async function fetchProductHero(productId: number, signal: AbortSignal) {
  const response = await fetch(ZION_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: PRODUCT_HERO_QUERY,
      variables: { id: productId },
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Zion request failed: ${response.status}`)
  }

  const payload = (await response.json()) as {
    data?: { product_by_pk?: ProductHero | null }
    errors?: Array<{ message?: string }>
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? 'Zion returned an error')
  }

  return payload.data?.product_by_pk ?? null
}

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
  const getSpotlightRadius = () => {
    if (typeof window === 'undefined') return DESKTOP_SPOTLIGHT_R
    const shortestSide = Math.min(window.innerWidth, window.innerHeight)
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      return Math.max(96, Math.min(138, shortestSide * 0.34))
    }
    return DESKTOP_SPOTLIGHT_R
  }

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

    const radius = getSpotlightRadius()
    const gradient = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      radius
    )
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.54, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.72)')
    gradient.addColorStop(0.84, 'rgba(255,255,255,0.28)')
    gradient.addColorStop(0.94, 'rgba(255,255,255,0.08)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, radius, 0, Math.PI * 2)
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
  const productId = useRef(getProductIdFromUrl())
  const [productHero, setProductHero] = useState<ProductHeroState>({
    data: null,
    loading: true,
    error: null,
  })
  const initialSpotlight = () => ({
    x: typeof window === 'undefined' ? 0 : window.innerWidth * 0.62,
    y: typeof window === 'undefined' ? 0 : window.innerHeight * 0.58,
  })
  const [cursorPos, setCursorPos] = useState(initialSpotlight)
  const mouse = useRef(initialSpotlight())
  const smooth = useRef(initialSpotlight())
  const rafRef = useRef<number>(0)

  const animate = useCallback(() => {
    smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
    smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
    setCursorPos({ x: smooth.current.x, y: smooth.current.y })
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchProductHero(productId.current, controller.signal)
      .then((data) => {
        setProductHero({
          data,
          loading: false,
          error: data ? null : `Product ${productId.current} was not found`,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setProductHero({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load product',
        })
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) {
        mouse.current = { x: touch.clientX, y: touch.clientY }
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchstart', handleTouchMove, { passive: false })
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  const baseImage =
    productHero.data?.ud_shangcengtu_64875d?.url ??
    productHero.data?.ud_toushitu_50a670?.url ??
    BG_IMAGE_1
  const revealImage =
    productHero.data?.ud_toushitu_50a670?.url ??
    productHero.data?.ud_shangcengtu_64875d?.url ??
    BG_IMAGE_2
  const productTitle = productHero.data?.product_name ?? 'THERMOS'
  const productSubtitle =
    productHero.data?.product_subtitle ?? 'Behind the shell lies innovation'
  const productDescription =
    productHero.data?.detail_text ??
    productHero.data?.purchase_notes ??
    'Move your cursor across the bottle to reveal the engineering inside.'
  const statusText = productHero.loading
    ? `Loading product ${productId.current}`
    : productHero.error
      ? productHero.error
      : `Product ID ${productHero.data?.id ?? productId.current}`

  return (
    <div
      className="min-h-screen bg-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh', touchAction: 'none' }}
      >
        {/* Base Image */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${baseImage})` }}
        />

        {/* Reveal Layer */}
        <RevealLayer
          image={revealImage}
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
              style={{ animationDelay: '0.25s' }}
            >
              {productTitle}
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ animationDelay: '0.42s' }}
            >
              {productSubtitle}
            </span>
          </h1>
        </div>

        {/* Bottom-left paragraph */}
        <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade" style={{ animationDelay: '0.7s' }}>
          <p className="text-sm text-white/80 leading-relaxed">
            {statusText}
          </p>
        </div>

        {/* Bottom-right block */}
        <div className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade" style={{ animationDelay: '0.85s' }}>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            {productDescription}
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
