import * as Yup from "yup";

export const roomCreateSchema = Yup.object({
  title: Yup.string()
    .min(3, "Title must be at least 3 characters long")
    .required("Title is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters long")
    .required("Description is required"),
  language: Yup.string().required("Language is required"),
  level: Yup.string()
    .oneOf(["Beginner", "Intermediate", "Advanced", "Native"], "Invalid level")
    .required("Level is required"),
  maxParticipants: Yup.number()
    .min(2, "At least 2 participants are required")
    .max(10, "Cannot have more than 10 participants")
    .required("Max participants is required"),
});
