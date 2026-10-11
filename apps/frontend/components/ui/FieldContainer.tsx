import React from "react";
import { labelClass } from "./formStyles";

type FieldContainerProps = {
  children: React.ReactNode;
  label: string;
  name: string;
  hint?: string;
};

const FieldContainer: React.FC<FieldContainerProps> = ({
  children,
  label,
  name,
  hint,
}) => {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

export default FieldContainer;