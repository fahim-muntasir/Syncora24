import { Auth } from "../../models";

export const findAuthenticateUser = async (id: string) => {
  try {
    const user = await Auth.findById(id);

    return user;
  } catch (error) {
    throw error;
  }
};

export const existAuthenticateUser = async (email: string) => {
  try {
    const user = await Auth.findOne({ email });

    if (user) {
      return user;
    }

    return false;
  } catch (error) {
    throw error;
  }
};