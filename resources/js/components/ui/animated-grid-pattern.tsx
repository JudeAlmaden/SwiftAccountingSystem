import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  strokeDasharray?: string
  numSquares?: number
  className?: string
  maxOpacity?: number
  duration?: number
  [key: string]: unknown
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = "0",
  numSquares = 50,
  className,
  maxOpacity = 0.15,
  duration = 3,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId()
  const [squares, setSquares] = useState<Array<[number, number, number]>>([])

  useEffect(() => {
    const gridWidth = Math.ceil(window.innerWidth / width)
    const gridHeight = Math.ceil(window.innerHeight / height)

    const generateSquares = () => {
      const newSquares: Array<[number, number, number]> = []
      
      for (let i = 0; i < numSquares; i++) {
        newSquares.push([
          Math.floor(Math.random() * gridWidth),
          Math.floor(Math.random() * gridHeight),
          i * (duration / numSquares) // Stagger the delays
        ])
      }
      
      return newSquares
    }

    setSquares(generateSquares())

    // Regenerate all squares after full cycle completes
    const interval = setInterval(() => {
      setSquares(generateSquares())
    }, duration * 1000)

    return () => clearInterval(interval)
  }, [numSquares, width, height, duration])

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(([x, y, delay], index) => (
          <rect
            strokeWidth="0"
            key={`${x}-${y}-${index}`}
            width={width - 1}
            height={height - 1}
            x={x * width + 1}
            y={y * height + 1}
            fill="#086f08"
            style={{
              opacity: 0,
              animation: `pulse ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite`,
            }}
          />
        ))}
      </svg>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0; }
            20% { opacity: 0; }
            40% { opacity: ${maxOpacity}; }
            60% { opacity: ${maxOpacity}; }
            80% { opacity: 0; }
            100% { opacity: 0; }
          }
        `}
      </style>
    </svg>
  )
}
