import axios from "axios";

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`,
      {
        email,
        password,
        username,
      }
    );
    return response.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error && "response" in error
        ? (error as any)?.response?.data?.message
        : "Sign up failed";
    throw new Error(message);
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signin`,
      {
        email,
        password,
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error && "response" in error
        ? (error as any)?.response?.data?.message
        : "Sign in failed";
    throw new Error(message);
  }
};
