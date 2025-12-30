import { useUsersList, useDeleteUser } from "@/hooks/use-users-list";
import { useUser } from "@/hooks/use-user";
import { Sidebar } from "@/components/Sidebar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Users() {
    const { data: users, isLoading, refetch, isRefetching } = useUsersList();
    const { user: currentUser } = useUser();
    const deleteUser = useDeleteUser();

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            deleteUser.mutate(id);
        }
    };

    return (
        <div className="flex min-h-screen bg-background overflow-x-hidden">
            <Sidebar />
            <main className="md:pl-64 flex-1 w-full">
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold font-display">User Analysis</h1>
                            <p className="text-muted-foreground mt-1">Review registered users and their credentials.</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isRefetching || isLoading}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>
                                List of all users in the system including their hashed passwords for security analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">ID</TableHead>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Role</TableHead>

                                                <TableHead className="font-mono">Password Hash</TableHead>
                                                <TableHead className="w-[100px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users?.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.id}</TableCell>
                                                    <TableCell>{user.username}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground break-all">
                                                        {user.password}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={deleteUser.isPending || user.id === currentUser?.id}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete User"}
                                                        >
                                                            {deleteUser.isPending && deleteUser.variables === user.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {!users?.length && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        No users found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
