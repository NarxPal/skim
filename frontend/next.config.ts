import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
  },
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: `${process.env.PROJECT_URL_CONFIG}`,
  //       port: "",
  //       pathname: `${process.env.IMAGE_PATHNAME}`,
  //     },
  //   ],
  // },
};

export default nextConfig;
