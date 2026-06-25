export type SignInFormValues = {
  email: string;
  password: string;
};

export type SignUpFormValues = SignInFormValues & {
  fullName: string;
};

export type UserType = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  code: number;
  data: {
    token: string;
    user: UserType;
  };
  links: {
    self: string;
  };
  message: string;
  success: boolean;
};
