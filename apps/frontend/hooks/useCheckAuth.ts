import { useEffect, useState } from "react";
import { useAppDispatch } from "@/libs/hooks";
import { userLoggedIn } from "@/libs/features/auth/authSlice";

export const useCheckAuth = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = JSON.parse(localStorage.getItem("auth") || "{}");

        if (authData.token && authData.user) {
          dispatch(userLoggedIn(authData.user));
        }
      } catch (error) {
        console.error("Error parsing authentication data:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  return { loading };
};