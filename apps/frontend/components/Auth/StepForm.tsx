import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ErrorMessage, Field, Formik, useFormikContext } from "formik";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInSchema, signUpSchema } from "@/schemas";
import FieldContainer from "@/components/ui/FieldContainer";
import PasswordInput from "@/components/ui/PasswordInput";
import { errorClass, inputClass } from "@/components/ui/formStyles";
import type { SignInFormValues, SignUpFormValues } from "@/types/auth";
import { getRequestError } from "@/utils/AuthError";
import { primaryButton, textButton } from "@/components/Auth/classes";

type AuthMode = "choice" | "signin" | "signup";
type FlowMode = Exclude<AuthMode, "choice">;
type StepField = "fullName" | "email" | "password";

const FLOWS: Record<FlowMode, StepField[]> = {
  signin: ["email", "password"],
  signup: ["fullName", "email", "password"],
};

function ResetStatusOnStep({ step }: { step: number }) {
  const { setStatus } = useFormikContext();

  useEffect(() => {
    setStatus(undefined);
  }, [step, setStatus]);

  return null;
}

function StepPanel({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`transition duration-200 ease-out motion-reduce:transition-none ${
        shown ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function StepInput({ field, mode }: { field: StepField; mode: FlowMode }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(field)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [field]);

  if (field === "fullName") {
    return (
      <FieldContainer label="Full name" name="fullName">
        <Field
          id="fullName"
          type="text"
          name="fullName"
          className={inputClass}
          autoComplete="name"
          placeholder="Your name"
        />
        <ErrorMessage name="fullName" component="p" className={errorClass} />
      </FieldContainer>
    );
  }

  if (field === "email") {
    return (
      <FieldContainer label="Email" name="email">
        <Field
          id="email"
          type="email"
          name="email"
          inputMode="email"
          className={inputClass}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <ErrorMessage name="email" component="p" className={errorClass} />
      </FieldContainer>
    );
  }

  return (
    <FieldContainer
      label="Password"
      name="password"
      hint={mode === "signup" ? "At least 6 characters." : undefined}
    >
      <PasswordInput
        name="password"
        placeholder={mode === "signup" ? "Create a password" : "Your password"}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        minLength={mode === "signup" ? 6 : undefined}
      />
      <ErrorMessage name="password" component="p" className={errorClass} />
    </FieldContainer>
  );
}

export default function StepForm({
  mode,
  step,
  setStep,
  initialEmail,
  onSignIn,
  onSignUp,
}: {
  mode: FlowMode;
  step: number;
  setStep: (step: number) => void;
  initialEmail: string;
  onSignIn: (values: SignInFormValues) => Promise<void>;
  onSignUp: (values: SignUpFormValues) => Promise<void>;
}) {
  const fields = FLOWS[mode];
  const current = fields[step];
  const isLast = step === fields.length - 1;
  const emailStep = fields.indexOf("email");

  return (
    <Formik<SignUpFormValues>
      initialValues={{ fullName: "", email: initialEmail, password: "" }}
      validationSchema={mode === "signin" ? signInSchema : signUpSchema}
      onSubmit={async (values, { setStatus }) => {
        setStatus(undefined);
        try {
          if (mode === "signin") {
            await onSignIn({ email: values.email, password: values.password });
          } else {
            await onSignUp(values);
          }
        } catch (error) {
          setStatus(getRequestError(error));
        }
      }}
    >
      {({ values, status, isSubmitting, validateForm, setFieldTouched, submitForm }) => {
        // Validate only what the user has reached. Later steps are empty on purpose.
        const advance = async () => {
          const errors = await validateForm();
          const invalid = fields.findIndex(
            (field, index) => index <= step && Boolean(errors[field]),
          );

          if (invalid !== -1) {
            await setFieldTouched(fields[invalid], true, false);
            setStep(invalid);
            return;
          }

          if (isLast) {
            await submitForm();
            return;
          }

          setStep(step + 1);
        };

        return (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void advance();
            }}
          >
            <ResetStatusOnStep step={step} />

            {step > emailStep && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#161616] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-gray-500">
                    {mode === "signup" ? values.fullName : "Signing in as"}
                  </p>
                  <p className="truncate text-sm text-white">{values.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(emailStep)}
                  className={`shrink-0 text-sm ${textButton}`}
                >
                  Change
                </button>
              </div>
            )}

            <StepPanel key={current}>
              <StepInput field={current} mode={mode} />
            </StepPanel>

            {status && (
              <p className={errorClass} role="alert">
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={primaryButton}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : isLast ? (
                mode === "signin" ? "Sign in" : "Create account"
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        );
      }}
    </Formik>
  );
}