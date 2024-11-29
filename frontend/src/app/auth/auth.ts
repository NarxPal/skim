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
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Sign up failed");
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signin`,
      {
        email,
        password,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Sign in failed");
  }
};
