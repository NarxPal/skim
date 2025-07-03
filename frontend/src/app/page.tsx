"use client";
import React from "react";
import Link from "next/link";
import styles from "@/styles/landingPage.module.css";
import Image from "next/image";
import { Fascinate_Inline } from "next/font/google";

const fascinateInline = Fascinate_Inline({ subsets: ["latin"], weight: "400" });

const Home = () => {
  return (
    <div className={styles.lp_bg}>
      <div className={styles.header}>
        <div className={styles.items}>
          <div className={styles.logo_items}>
            <Image
              alt="logo"
              src="/logo3d.png"
              height={40}
              width={40}
              priority={true}
              // className="w-auto h-auto"
            />
            <div className={`${styles.logo_name} ${fascinateInline.className}`}>
              Skim
            </div>
          </div>
          <div className={styles.right_items}>
            <div className={styles.log_btns}>
              <Link href="/auth">
                <button className={styles.logIn_btn}>LogIn</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.hero_items}>
        <div className={`${styles.grid_overlay} ${styles.masked}`} />
        <div className={styles.hero_section}>
          <div className={styles.info}>No email verification required!</div>

          <div className={styles.head}>
            <h1 className={`${fascinateInline.className}`}>
              easy to use <span className={styles.txt_underline}>editor</span>{" "}
              to help create short form content
            </h1>
          </div>

          <div className={`${styles.desc} ${fascinateInline.className}`}>
            <span className={styles.txt_underline}>skim</span> &nbsp; helps busy
            proffesionals edit their content fast and easy
          </div>
          <div className={styles.hero_btns}>
            <Link href="/auth">
              <button className={styles.btn}>Start Now</button>
            </Link>
          </div>
        </div>
        <div className={styles.last_notes}>
          creator &nbsp;
          <span className="text-blue_btn">
            <Link
              href="https://twitter.com/narxpal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Narendra Rathore{" "}
            </Link>{" "}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
