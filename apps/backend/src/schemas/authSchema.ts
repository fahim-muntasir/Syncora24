import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().nonempty("Name is required."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .nonempty("Email is required."),
  password: z.string().nonempty("Password is required."),
});

export const signInSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .nonempty("Email is required."),
  password: z.string().nonempty("Password is required."),
});