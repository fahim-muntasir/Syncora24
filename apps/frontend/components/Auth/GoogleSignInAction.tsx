import { useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import { secondaryButton } from "@/components/Auth/classes";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInAction({
  onSuccess,
  onError,
  disabled,
}: {
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
  disabled: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  // Google only accepts a width between 200 and 400px, so fit the modal and clamp.
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const update = () =>
      setButtonWidth(Math.round(Math.min(400, Math.max(200, element.clientWidth))));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!googleClientId) {
    return (
      <div>
        <button type="button" disabled className={secondaryButton}>
          Continue with Google
        </button>
        <p className="mt-2 text-center text-xs text-gray-500" role="status">
          Google sign-in is not configured. Continue with email instead.
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div
        ref={wrapperRef}
        className={`flex w-full justify-center overflow-hidden ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          text="continue_with"
          shape="rectangular"
          theme="filled_black"
          size="large"
          width={String(buttonWidth)}
          useOneTap={false}
        />
      </div>
    </GoogleOAuthProvider>
  );
}