interface SessionDotsProps {
  completed: number
  sessions: number
}

export default function SessionDots({ completed, sessions }: SessionDotsProps) {
  return (
    <div role="img" aria-label={`${completed} of ${sessions} focus sessions completed`} className="mt-3 flex justify-center gap-2">
      {Array.from({ length: sessions }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`size-2 rounded-full border border-mode ${index < completed ? 'bg-mode' : 'bg-transparent'}`}
        />
      ))}
    </div>
  )
}
