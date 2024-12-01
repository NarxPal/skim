import React from "react";
import Link from "next/link";

const Home = () => {
  return (
    <div>
      hey bro just login here :
      <span>
        <Link href="/auth">signup</Link>
      </span>
    </div>
  );
};

export default Home;
