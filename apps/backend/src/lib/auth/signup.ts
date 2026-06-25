import { Auth } from "../../models";

enum Role {
  Admin = "admin",
  User = "user",
}

type SignUp = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

export const signUp = async ({
  fullName,
  email,
  password,
  role = Role.User,
}: SignUp) => {
  try {
    const user = await Auth.create({
      fullName,
      email,
      password,
      role,
    });

    return user;
  } catch (error) {
    throw error;
  }
};
