import React, { useEffect, useRef } from "react";

function StreamVideo({
  stream,
  muted,
  className,
}: {
  stream: MediaStream;
  muted: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || element.srcObject === stream) return;
    element.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      playsInline
      className={className}
    />
  );
}

export default StreamVideo;