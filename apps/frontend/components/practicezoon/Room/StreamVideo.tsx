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
    if (!element) return;
    if (element.srcObject !== stream) element.srcObject = stream;

    // Detach when the stream changes or the view closes.
    return () => {
      element.pause();
      element.srcObject = null;
    };
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