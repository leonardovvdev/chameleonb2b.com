// core/contexts/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

  const resueltoPara = useRef<string | null>(null); // usuario ya resuelto
  const enCurso = useRef<{ userId: string; p: Promise<void> } | null>(null); // llamada en vuelo

  const resolverCustomer = useCallback(async (userId: string, forzar = false) => {
    // Ya lo tenemos y no se pidió refrescar → no llamar al backend
    if (!forzar && resueltoPara.current === userId) return;
    // Hay una llamada en vuelo para este usuario → reutilizarla
    if (enCurso.current?.userId === userId) return enCurso.current.p;

    const p = (async () => {
      const { data: customer, error } = await obtenerCustIdPorAuthId(userId);

      if (error || !customer) {
        // Es normal justo después del login con Google: el customer
        // se crea en el backend desde /auth/callback.
        console.warn("Customer aún no disponible:", error ?? "sin fila");
        resueltoPara.current = null;
        setCustId(null);
        setCustNameBucket(null);
        return;
      }

      resueltoPara.current = userId;
      setCustId(customer.cust_id);
      setCustNameBucket(customer.cust_name_bucket);
    })().finally(() => {
      enCurso.current = null;
    });

    enCurso.current = { userId, p };
    return p;
  }, []);

  /** Vuelve a consultar el customer de la sesión actual (úsalo tras registrarlo). */
  const refreshCustomer = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await resolverCustomer(data.session.user.id, true); // forzar: tras registrar hay que releer
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      bindCacheToUser(session?.user?.id ?? null); // otra cuenta o cierre de sesión → caché vacía
      setSession(session);

      if (!session?.user) {
        resueltoPara.current = null;
        setCustId(null);
        setCustNameBucket(null);
        localStorage.removeItem("aw_erp_jwt");
        return;
      }

      // INITIAL_SESSION ya lo cubre inicializar(); TOKEN_REFRESHED no cambia al customer
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;

      // Sin await dentro del callback: evita bloqueos del cliente de auth.
      setTimeout(() => {
        void resolverCustomer(session.user.id);
      }, 0);
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