import React from "react";

type FieldContainerProps = {
  children: React.ReactNode;
  label: string;
  name: string;
};

const FieldContainer: React.FC<FieldContainerProps> = ({
  children,
  label,
  name,
}) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
};

export default FieldContainer;
