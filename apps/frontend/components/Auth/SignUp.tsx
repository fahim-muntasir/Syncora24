"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { SignUpFormValues } from "@/types/auth";
import { signUpSchema } from "@/schemas";
import Button from "../ui/Button";
import FieldContainer from "../ui/FieldContainer";
import PasswordInput from "../ui/PasswordInput";
import { inputClass, errorClass } from "../ui/formStyles";
import { useSignUpMutation } from "@/libs/features/auth/authApiSlice";
import { toast } from "react-hot-toast";

export default function SignUp() {
  const [signUp, { isError }] = useSignUpMutation();
  const [errorToastShown, setErrorToastShown] = useState(false);

  const initialValues: SignUpFormValues = {
    fullName: "",
    email: "",
    password: "",
  };

  const doSubmit = async (
    values: SignUpFormValues,
    { setSubmitting }: FormikHelpers<SignUpFormValues>
  ) => {
    setErrorToastShown(false);
    try {
      await signUp(values).unwrap();

      toast.success("Account created successfully!");

      setTimeout(() => { window.location.href = "/auth/signin"; }, 2000);
    } catch (error) {
      console.error("Sign-up failed:", error);
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (isError && !errorToastShown) {
      toast.error("An error occurred. Please try again later.");
      setErrorToastShown(true);
    }
  }, [isError, errorToastShown]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Join rooms and practice speaking with real people.
        </p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={signUpSchema}
        onSubmit={doSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            <FieldContainer label="Full name" name="fullName">
              <Field
                id="fullName"
                type="text"
                name="fullName"
                className={inputClass}
                required
                autoComplete="name"
                placeholder="John Doe"
              />
              <ErrorMessage name="fullName" component="p" className={errorClass} />
            </FieldContainer>

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

            <FieldContainer
              label="Password"
              name="password"
              hint="At least 6 characters."
            >
              <PasswordInput
                name="password"
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={6}
              />
              <ErrorMessage name="password" component="p" className={errorClass} />
            </FieldContainer>

            <Button type="submit" isDisabled={isSubmitting} fullWidth={true}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              )}
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>

            <p className="border-t border-white/[0.06] pt-5 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="rounded font-medium text-green-400 transition-colors hover:text-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
              >
                Sign in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}