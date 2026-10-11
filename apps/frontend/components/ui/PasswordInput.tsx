"use client";
import React, { useState } from "react";
import { Field } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "./formStyles";

type PasswordInputProps = {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
};

export default function PasswordInput({
  name,
  placeholder,
  autoComplete,
  minLength,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Field
        id={name}
        type={visible ? "text" : "password"}
        name={name}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}