import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    login: (user: Pick<InsertUser, "username" | "password">) => Promise<void>;
    register: (user: InsertUser) => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch current user
    const { data: user, isLoading, error } = useQuery<User | null, Error>({
        queryKey: ["/api/user"],
        queryFn: async () => {
            const res = await fetch("/api/user");
            if (res.status === 401) return null;
            if (!res.ok) throw new Error("Failed to fetch user");
            return res.json();
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: Pick<InsertUser, "username" | "password">) => {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (data: User) => {
            queryClient.setQueryData(["/api/user"], data);
            toast({ title: "Welcome back!", description: `Logged in as ${data.username}` });
        },
        onError: (error: Error) => {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: InsertUser) => {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: (data: User) => {
            queryClient.setQueryData(["/api/user"], data);
            toast({ title: "Account created", description: "You have been logged in automatically." });
        },
        onError: (error: Error) => {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/logout", { method: "POST" });
            if (!res.ok) throw new Error("Logout failed");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({ title: "Logged out", description: "See you next time!" });
        },
        onError: (error: Error) => {
            toast({ title: "Logout failed", description: error.message, variant: "destructive" });
        },
    });

    return (
        <UserContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error: error instanceof Error ? error : null,
                login: async (creds) => await loginMutation.mutateAsync(creds),
                register: async (data) => await registerMutation.mutateAsync(data),
                logout: async () => await logoutMutation.mutateAsync(),
            }}
        >
            {children}
        </UserContext.Provider>
    );
}
