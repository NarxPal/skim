"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/auth.module.css";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "./auth";
import axios from "axios";
import Cookies from "js-cookie";

const Auth = () => {
  const router = useRouter();

  const [login, setLogin] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>("");

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      const userCredential = await signUp(
        formData.email,
        formData.password,
        formData.username
      );
      console.log("User signed up:", userCredential);
      const uid = userCredential.user.user_id;
      if (userCredential && uid) {
        router.push(`/project/${uid}`);
      }
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleLogIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const userCredential = await signIn(formData.email, formData.password);
      // setAccessToken(userCredential.accessToken);
      const uid = userCredential.user.user_id;

      const token = userCredential.accessToken;
      Cookies.set("access_token", token, {
        expires: 365,
        secure: false, // Set to true in production for HTTPS
        sameSite: "Lax", // For cross-origin support
        priority: "High",
      });

      router.push(`/project/${uid}`);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div>
      <p>
        {login ? "not a member?" : "already a memeber?"}{" "}
        <span className={styles.log_span} onClick={() => setLogin(!login)}>
          {login ? "Signup here" : "login here"}
        </span>
      </p>
      <h3>{login ? "LogIn" : "SignUp"}</h3>

      <form onSubmit={login ? handleLogIn : handleSignUp}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="text-black"
          />
        </div>

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="text-black"
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="text-black"
          />
        </div>

        <button type="submit">{login ? "LogIn" : "SignUp"}</button>
      </form>
    </div>
  );
};

export default Auth;
