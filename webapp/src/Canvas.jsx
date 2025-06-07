import { useRef, useEffect } from 'react'

function Canvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0f0'
    ctx.fillRect(10, 10, 100, 100)
  }, [])

  return <canvas ref={canvasRef} width={800} height={600} />
}

export default Canvas
