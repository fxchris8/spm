import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define User type
interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

// Define Context type — token is no longer exposed to the frontend (stored in HttpOnly cookie)
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until /me check finishes
  const navigate = useNavigate();

  // On mount: restore session by hitting /api/auth/me (reads HttpOnly cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include', // send cookie automatically
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (newUser: User) => {
    // Token is set as HttpOnly cookie by the backend — we only store user info in state
    setUser(newUser);
  };

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // send cookie so backend can clear it
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      toast.info('Logged out successfully');
      navigate('/login');
    }
  }, [navigate]);

  // Idle Timer Logic (30 mins = 1800000 ms)
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          console.log('User idle for 30 mins, logging out...');
          toast.warning('Session expired due to inactivity');
          logout();
        },
        30 * 60 * 1000
      );
    };

    // Events to listen for activity
    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    // Attach listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initial start
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]); // Re-run if user or logout changes

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
