// core/contexts/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { obtenerCustIdPorAuthId } from "../services/auth.service.ts";
import { bindCacheToUser } from "../services/cache";

interface AuthContextType {
  custId: number | null;
  custNameBucket: string | null;
  session: any;
  loadingAuth: boolean;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  custId: null,
  custNameBucket: null,
  session: null,
  loadingAuth: true,
  refreshCustomer: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [custId, setCustId] = useState<number | null>(null);
  const [custNameBucket, setCustNameBucket] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const resolverCustomer = useCallback(async (userId: string) => {
    const { data: customer, error } = await obtenerCustIdPorAuthId(userId);

    if (error || !customer) {
      // Es normal justo después del login con Google: el customer
      // se crea en el backend desde /auth/callback.
      console.warn("Customer aún no disponible:", error ?? "sin fila");
      setCustId(null);
      setCustNameBucket(null);
      return;
    }

    setCustId(customer.cust_id);
    setCustNameBucket(customer.cust_name_bucket);
  }, []);

  /** Vuelve a consultar el customer de la sesión actual (úsalo tras registrarlo). */
  const refreshCustomer = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await resolverCustomer(data.session.user.id);
    }
  }, [resolverCustomer]);

  useEffect(() => {
    const inicializar = async () => {
      const { data } = await supabase.auth.getSession();
      bindCacheToUser(data.session?.user?.id ?? null);
      setSession(data.session);

      if (data.session?.user) {
        await resolverCustomer(data.session.user.id);
      }

      setLoadingAuth(false);
    };

    void inicializar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      bindCacheToUser(session?.user?.id ?? null); // otra cuenta o cierre de sesión → caché vacía
      setSession(session);

      if (session?.user) {
        // Sin await dentro del callback: evita bloqueos del cliente de auth.
        setTimeout(() => {
          void resolverCustomer(session.user.id);
        }, 0);
      } else {
        setCustId(null);
        setCustNameBucket(null);
        localStorage.removeItem("aw_erp_jwt");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resolverCustomer]);

  return (
    <AuthContext.Provider
      value={{ custId, custNameBucket, session, loadingAuth, refreshCustomer }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);