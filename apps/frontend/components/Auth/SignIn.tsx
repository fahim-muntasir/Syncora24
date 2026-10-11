"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { SignInFormValues } from "@/types/auth";
import { signInSchema } from "@/schemas";
import Button from "../ui/Button";
import FieldContainer from "../ui/FieldContainer";
import PasswordInput from "../ui/PasswordInput";
import { inputClass, errorClass } from "../ui/formStyles";
import { useSignInMutation } from "@/libs/features/auth/authApiSlice";
import { toast } from "react-hot-toast";

export default function SignIn() {
  const [signIn] = useSignInMutation();
  const initialValues: SignInFormValues = {
    email: "",
    password: "",
  };

  const doSubmit = async (
    values: SignInFormValues,
    { setSubmitting }: FormikHelpers<SignInFormValues>
  ) => {
    try {
      await signIn(values).unwrap();

      toast.success("Sign-in successful!");
      setSubmitting(false);
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to join live practice rooms.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={signInSchema}
        onSubmit={doSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            <FieldContainer label="Email" name="email">
              <Field
                id="email"
                type="email"
                name="email"
                className={inputClass}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
              <ErrorMessage name="email" component="p" className={errorClass} />
            </FieldContainer>

            <FieldContainer label="Password" name="password">
              <PasswordInput
                name="password"
                placeholder="Your password"
                autoComplete="current-password"
              />
              <ErrorMessage name="password" component="p" className={errorClass} />
            </FieldContainer>

            <Button type="submit" isDisabled={isSubmitting} fullWidth={true}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              )}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>

            <p className="border-t border-white/[0.06] pt-5 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="rounded font-medium text-green-400 transition-colors hover:text-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
              >
                Sign up
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}