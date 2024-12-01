import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserId } from "@/redux/userId"; // Adjust import as necessary

export function fetchUser(uid: string | string[] | undefined) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const token = Cookies.get("access_token");

  useEffect(() => {
    const handleGetUser = async () => {
      if (!token || !uid) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("User data from fetchUser:", response.data);
        const res_uid = response.data.user_id;
        dispatch(setUserId(res_uid));
        setLoading(false);
        return response.data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth");
      }
    };

    handleGetUser();
  }, [uid, token, router, dispatch]);

  return { loading };
}
