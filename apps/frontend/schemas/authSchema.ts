import * as yup from "yup";

export const signInSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address.")
    .required("Email is required."),
  password: yup.string().required("Password is required."),
});

export const signUpSchema = yup.object({
  fullName: yup.string().required("Name is required."),
  email: yup
    .string()
    .email("Please enter a valid email address.")
    .required("Email is required."),
  password: yup.string().required("Password is required."),
});