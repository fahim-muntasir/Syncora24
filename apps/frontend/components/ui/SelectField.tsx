import React from "react";
import { Field } from "formik";
import { ChevronDown } from "lucide-react";
import { inputClass } from "./formStyles";

type SelectFieldProps = {
  name: string;
  children: React.ReactNode;
};

export default function SelectField({ name, children }: SelectFieldProps) {
  return (
    <div className="relative">
      <Field
        as="select"
        id={name}
        name={name}
        className={`${inputClass} appearance-none pr-9 [&>option]:bg-[#161616]`}
      >
        {children}
      </Field>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        aria-hidden="true"
      />
    </div>
  );
}