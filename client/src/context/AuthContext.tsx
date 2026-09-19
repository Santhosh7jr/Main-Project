import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";
import {
  loginDoctor,
  registerDoctor,
  getCurrentDoctor,
  type Doctor,
  type LoginData,
  type RegisterData,
} from "../services/authService";

interface AuthContextType {
  doctor: Doctor | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("medguard_token")
  );
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Restore logged-in session when the app starts
  // --------------------------------------------------

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("medguard_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

        const currentDoctor = await getCurrentDoctor();

        setDoctor(currentDoctor);
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to restore authentication:", error);

        localStorage.removeItem("medguard_token");

        delete api.defaults.headers.common.Authorization;

        setDoctor(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const login = async (data: LoginData) => {
    const response = await loginDoctor(data);

    localStorage.setItem("medguard_token", response.token);

    api.defaults.headers.common.Authorization = `Bearer ${response.token}`;

    setToken(response.token);
    setDoctor(response.doctor);
  };

  // --------------------------------------------------
  // Register
  // --------------------------------------------------

  const register = async (data: RegisterData) => {
    const registeredDoctor = await registerDoctor(data);

    /*
     * Registration only creates the account.
     * The doctor still needs to log in.
     */

    console.log("Doctor registered:", registeredDoctor);
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = () => {
    localStorage.removeItem("medguard_token");

    delete api.defaults.headers.common.Authorization;

    setDoctor(null);
    setToken(null);
  };

  const value: AuthContextType = {
    doctor,
    token,
    loading,
    isAuthenticated: !!token && !!doctor,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------
// Custom hook
// --------------------------------------------------

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};