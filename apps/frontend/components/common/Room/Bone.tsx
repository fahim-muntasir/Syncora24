export default function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse motion-reduce:animate-none rounded bg-white/[0.06] ${className}`}
    />
  );
}