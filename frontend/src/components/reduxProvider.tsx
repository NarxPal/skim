"use client"; //  since this file is being used in layout.tsx

import { Provider } from "react-redux";
import { store } from "@/redux/store"; // Adjust the path as necessary

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
