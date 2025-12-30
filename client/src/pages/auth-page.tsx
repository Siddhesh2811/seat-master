import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuthPage() {
    const { user, login, register } = useUser();
    const [, setLocation] = useLocation();

    if (user) {
        setLocation("/");
        return null;
    }

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Seat Manager Admin</CardTitle>
                    <CardDescription>Login or register to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <LoginForm />
                        </TabsContent>

                        <TabsContent value="register">
                            <RegisterForm />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function LoginForm() {
    const { login } = useUser();
    const form = useForm<Pick<InsertUser, "username" | "password">>({
        resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        try {
            await login(data);
        } catch (e) {
            // Handled by useUser toast
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    Login
                </Button>
            </form>
        </Form>
    );
}

function RegisterForm() {
    const { register } = useUser();
    const form = useForm<InsertUser>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: { username: "", password: "", role: "user" },
    });

    const onSubmit = form.handleSubmit(async (data) => {
        try {
            await register(data);
        } catch (e) {
            // Handled by useUser toast
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    Register
                </Button>
            </form>
        </Form>
    );
}
