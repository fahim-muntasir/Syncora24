import { Auth } from "../../models";

enum Role {
  User = "user",
}

type SignUp = {
  fullName: string;
  email: string;
  password: string;
};

export const createSignupUserData = ({
  fullName,
  email,
  password,
}: SignUp) => ({
  fullName,
  email,
  password,
  role: Role.User,
});

export const signUp = async (input: SignUp) => {
  return Auth.create(createSignupUserData(input));
};
