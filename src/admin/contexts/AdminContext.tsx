import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { authService } from "../services/authService";
import { realtimeService } from "../services/realtimeService";
import type { Database, Permission, User, Role } from "../types/models";
interface Notice {
  id: string;
  message: string;
  error: boolean;
}
interface AdminContextValue {
  db: Database;
  user: User;
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
  run: <T>(
    action: () => Promise<T>,
    message?: string,
  ) => Promise<T | undefined>;
  toast: (message: string, error?: boolean) => void;
  notices: Notice[];
  dismiss: (id: string) => void;
}
const AdminContext = createContext<AdminContextValue | null>(null);
export function AdminProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const auth = useQuery({
    queryKey: ["auth"],
    queryFn: authService.me,
    retry: false,
    refetchInterval: 30000,
  });
  const query = useQuery({
    queryKey: ["admin-db"],
    queryFn: adminService.getDatabase,
    retry: false,
    enabled: !!auth.data,
  });
  useEffect(() => {
    if (auth.isFetched && !auth.isFetching && !auth.data)
      navigate("/admin/login", { replace: true });
  }, [auth.isFetched, auth.isFetching, auth.data, navigate]);
  useEffect(
    () =>
      realtimeService.subscribe(() => {
        void client.invalidateQueries({ queryKey: ["admin-db"] });
      }),
    [client],
  );
  const toast = useCallback((message: string, error = false) => {
    const id = crypto.randomUUID();
    setNotices((n) => [...n.slice(-3), { id, message, error }]);
    setTimeout(() => setNotices((n) => n.filter((v) => v.id !== id)), 5500);
  }, []);
  const refresh = useCallback(async () => {
    await client.invalidateQueries({ queryKey: ["admin-db"] });
  }, [client]);
  const run = useCallback(
    async <T,>(action: () => Promise<T>, message?: string) => {
      try {
        const result = await action();
        await refresh();
        if (message) toast(message);
        return result === undefined ? (true as T) : result;
      } catch (error) {
        toast(
          error instanceof Error
            ? error.message
            : "The change could not be saved.",
          true,
        );
        return undefined;
      }
    },
    [refresh, toast],
  );
  if (auth.isPending || query.isPending)
    return (
      <div className="admin-loading">
        <div className="skeleton" />
        <div className="skeleton" />
        <p>Preparing your control center…</p>
      </div>
    );
  if (auth.error || !auth.data)
    return (
      <div className="admin-loading">
        <h2>Session unavailable</h2>
        <p>Sign in to continue.</p>
        <a href="/admin/login">Go to sign in</a>
      </div>
    );
  if (query.error || !query.data)
    return (
      <div className="admin-loading">
        <h2>Unable to load your workspace</h2>
        <p>{query.error?.message}</p>
        <button onClick={() => query.refetch()}>Retry</button>
        <a href="/admin/settings">System settings</a>
      </div>
    );
  const role = query.data.collections.roles.find(
    (r) => r.id === auth.data?.roleId,
  ) as Role | undefined;
  return (
    <AdminContext.Provider
      value={{
        db: query.data,
        user: auth.data,
        can: (p) => !!role?.permissions.includes(p),
        refresh,
        run,
        toast,
        notices,
        dismiss: (id) => setNotices((n) => n.filter((v) => v.id !== id)),
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminProvider required");
  return value;
}
