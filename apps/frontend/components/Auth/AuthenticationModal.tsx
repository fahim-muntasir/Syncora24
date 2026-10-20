"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type CredentialResponse } from "@react-oauth/google";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/libs/hooks";
import {
  closeAuthenticationModal,
  openAuthenticationModal,
  setAuthenticationModalMode,
} from "@/libs/features/modal/modalSlice";
import {
  useGoogleSignInMutation,
  useSignInMutation,
  useSignUpMutation,
} from "@/libs/features/auth/authApiSlice";
import type { SignInFormValues, SignUpFormValues } from "@/types/auth";
import Modal from "@/components/common/Modal";
import { errorClass } from "@/components/ui/formStyles";
import GoogleSignInAction from "@/components/Auth/GoogleSignInAction";
import { focusRing, primaryButton, secondaryButton, textButton } from "@/components/Auth/classes";
import StepForm from "@/components/Auth/StepForm";
import { getRequestError } from "@/utils/AuthError";

type AuthMode = "choice" | "signin" | "signup";

const COPY = {
  choice: {
    title: "Welcome to Syncora24",
    body: "Sign in or create an account to join live practice rooms.",
  },
  done: {
    title: "Account created",
    body: "One more step and you’re in.",
  },
  signin: [
    { title: "Sign in", body: "Enter your email to continue." },
    { title: "Enter your password", body: "Almost there." },
  ],
  signup: [
    { title: "Create your account", body: "Let’s start with your name." },
    { title: "What’s your email?", body: "You’ll use it to sign in." },
    { title: "Create a password", body: "Choose something only you would know." },
  ],
};

function AuthenticationModal({ mode }: { mode: AuthMode }) {
  const dispatch = useAppDispatch();
  const [signIn, signInState] = useSignInMutation();
  const [signUp, signUpState] = useSignUpMutation();
  const [googleSignIn, googleState] = useGoogleSignInMutation();
  const [googleError, setGoogleError] = useState("");
  const [signUpComplete, setSignUpComplete] = useState(false);
  const [step, setStep] = useState(0);
  const [prefillEmail, setPrefillEmail] = useState("");
  const googleRequestInFlight = useRef(false);
  const busy = signInState.isLoading || signUpState.isLoading || googleState.isLoading;

  const setMode = (nextMode: AuthMode, nextStep = 0) => {
    setGoogleError("");
    setSignUpComplete(false);
    setStep(nextStep);
    dispatch(setAuthenticationModalMode(nextMode));
  };

  const close = () => dispatch(closeAuthenticationModal());

  const goBack = () => {
    if (step > 0) setStep(step - 1);
    else setMode("choice");
  };

  const handleSignIn = async (values: SignInFormValues) => {
    await signIn(values).unwrap();
    close();
  };

  const handleSignUp = async (values: SignUpFormValues) => {
    await signUp(values).unwrap();
    setPrefillEmail(values.email);
    setSignUpComplete(true);
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setGoogleError("Google did not return a sign-in credential. Please try again.");
      return;
    }
    if (googleRequestInFlight.current) return;
    googleRequestInFlight.current = true;
    setGoogleError("");
    try {
      await googleSignIn({ idToken: response.credential }).unwrap();
      close();
    } catch (error) {
      googleRequestInFlight.current = false;
      setGoogleError(getRequestError(error));
    }
  };

  const inFlow = mode === "signin" || mode === "signup";
  const showSteps = inFlow && !signUpComplete;
  const copy = signUpComplete
    ? COPY.done
    : mode === "choice"
      ? COPY.choice
      : COPY[mode][step] ?? COPY[mode][0];

  return (
    <Modal size="md" onClose={close} labelledBy="authentication-modal-title">
      <div className="px-6 pb-7 pt-4 sm:px-8 sm:pb-8">
        <div className="mb-5 flex h-9 items-center justify-between">
          {showSteps ? (
            <button
              type="button"
              onClick={goBack}
              className={`-ml-2 flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-gray-400 transition-colors hover:text-white motion-reduce:transition-none ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Close authentication dialog"
            className={`-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white motion-reduce:transition-none ${focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 text-center">
          <h2
            id="authentication-modal-title"
            className="text-xl font-semibold tracking-tight text-white"
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-gray-400">{copy.body}</p>
        </div>

        {mode === "choice" && (
          <div className="space-y-4">
            <GoogleSignInAction
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setGoogleError("Google sign-in was cancelled or could not be completed.")
              }
              disabled={busy}
            />

            {googleState.isLoading && (
              <p
                className="flex items-center justify-center gap-2 text-sm text-gray-300"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                Signing in securely…
              </p>
            )}
            {googleError && (
              <p className={errorClass} role="alert">
                {googleError}
              </p>
            )}

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs text-gray-500">or</span>
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <button
              type="button"
              onClick={() => setMode("signin")}
              disabled={busy}
              className={secondaryButton}
            >
              <Mail className="h-4 w-4 text-gray-400" />
              Continue with email
            </button>

            <p className="border-t border-white/[0.06] pt-5 text-center text-sm text-gray-400">
              New to Syncora24?{" "}
              <button type="button" onClick={() => setMode("signup")} className={textButton}>
                Create an account
              </button>
            </p>

            <p className="text-center text-xs text-gray-500">
              By continuing you agree to our{" "}
              <Link
                href="/about#guidelines"
                onClick={close}
                className="rounded text-gray-400 underline underline-offset-2 transition-colors hover:text-white"
              >
                community guidelines
              </Link>
              .
            </p>
          </div>
        )}

        {inFlow && signUpComplete && (
          <div className="space-y-4" aria-live="polite">
            <div className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-[#161616] p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              <p className="text-sm leading-relaxed text-gray-300">
                Your account is ready. Sign in with your email and password to continue.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("signin", prefillEmail ? 1 : 0)}
              className={primaryButton}
            >
              Continue to sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {inFlow && !signUpComplete && (
          <div>
            <StepForm
              key={mode}
              mode={mode}
              step={step}
              setStep={setStep}
              initialEmail={prefillEmail}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
            />
            <p className="mt-5 border-t border-white/[0.06] pt-5 text-center text-sm text-gray-400">
              {mode === "signin" ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className={textButton}
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function AuthenticationModalHost() {
  const dispatch = useAppDispatch();
  const authModal = useAppSelector((state) => state.modal.authModal);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedMode = url.searchParams.get("auth");
    if (requestedMode !== "signin" && requestedMode !== "signup") return;

    dispatch(openAuthenticationModal(requestedMode));
    url.searchParams.delete("auth");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [dispatch]);

  if (!authModal.isOpen) return null;
  return <AuthenticationModal mode={authModal.mode} />;
}