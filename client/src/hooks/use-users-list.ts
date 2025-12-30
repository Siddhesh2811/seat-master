import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUsersList() {
    return useQuery<User[]>({
        queryKey: ["/api/users"],
    });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useDeleteUser() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete user");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "User Deleted", description: "The user has been successfully removed." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}
