import React, { useEffect } from "react";
import RouteNavigation from "./navigation/RouteNavigation";
import { ToastProvider } from "react-native-toast-notifications";
import { AuthProvider } from "./contexte/AuthContext";
import "react-native-get-random-values";

import useUserStore from "./zustand/userStore";

export default function App() {
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <RouteNavigation />
      </ToastProvider>
    </AuthProvider>
  );
}
