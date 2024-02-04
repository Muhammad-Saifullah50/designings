import CursorSVG from "../../../public/assets/CursorSVG"

type CursorProps = {
  color: string
  x: number
  y: number
  message: string
}
const Cursor = ({ color, x, y, message }: CursorProps) => {
  return (
    <div
      className='pointer-events-none absolute left-0 top-0'
      style={{ transform: `translateX(${x}px) translateY(${y}px)` }}
    >
      <CursorSVG color={color} />

      {message && (
        <div className="rounded-3xl px-4 py-2 absolute left-2 top-5" style={{ backgroundColor: color }}>
          <p className="whitespace-nowrap leading-relaxed text-sm">{message}</p>

        </div>
      )}
    </div>
  )
}

export default Cursor
