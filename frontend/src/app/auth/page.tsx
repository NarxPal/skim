"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/auth.module.css";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "./auth";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const Auth = () => {
  const router = useRouter();

  const [login, setLogin] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const grid = document.getElementById("auth-grid");
    if (!grid) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      grid.style.maskImage = `
        radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,1) 120px, rgba(0,0,0,0) 300px)
      `;
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
      const uid = userCredential.user.user_id;
      const token = userCredential.accessToken;
      if (userCredential && uid && token) {
        Cookies.set("access_token", token, {
          expires: 365,
          secure: false, // true in prod
          sameSite: "Lax",
          priority: "High",
        });
        toast.success("Successfully signedUp");
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

      if (uid && token) {
        Cookies.set("access_token", token, {
          expires: 365,
          secure: false, // Set to true in production for HTTPS
          sameSite: "Lax", // For cross-origin support
          priority: "High",
        });
        toast.success("Successfully loggedIn");
        router.push(`/project/${uid}`);
      }
    } catch (error) {
      toast.error("Check your email or password");
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className={styles.auth_page}>
      <div className={styles.grid_overlay} id="auth-grid" />

      <div className={styles.auth_items}>
        <div className={styles.auth_card}>
          <div className={styles.txt_sl}>
            <p>
              {login ? "not a member?" : "already a memeber?"}{" "}
              <span
                className={styles.log_span}
                onClick={() => setLogin(!login)}
              >
                {login ? "Signup here" : "login here"}
              </span>
            </p>
            <h3 className={styles.sl_head}>{login ? "LogIn" : "SignUp"}</h3>
          </div>

          <form
            onSubmit={login ? handleLogIn : handleSignUp}
            className={styles.form}
          >
            <div className={styles.head_input}>
              <label htmlFor="username" className={styles.label}>
                Username:
              </label>
              <div className={styles.search_bar}>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={styles.input_box}
                />
              </div>
            </div>

            <div className={styles.head_input}>
              <label htmlFor="email" className={styles.label}>
                Email:
              </label>

              <div className={styles.search_bar}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input_box}
                />
              </div>
            </div>

            <div className={styles.head_input}>
              <label htmlFor="password" className={styles.label}>
                Password:
              </label>
              <div className={styles.search_bar}>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={styles.input_box}
                />
              </div>
            </div>
            <button className={styles.auth_btn} type="submit">
              {login ? "LogIn" : "SignUp"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
