import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you requested does not exist.
          </p>

          <div className="mt-6">
            <Link href="/events" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
              Return to Events Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
