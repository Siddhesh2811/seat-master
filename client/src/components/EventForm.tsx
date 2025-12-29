import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface EventFormProps {
  defaultValues?: Partial<InsertEvent>;
  onSubmit: (data: InsertEvent) => void;
  isSubmitting: boolean;
}

const defaultConfig = {
  zones: [
    {
      name: "Front Orchestra",
      sections: [
        {
          name: "Center",
          rows: [
            { label: "A", seatCount: 10 },
            { label: "B", seatCount: 12 }
          ]
        }
      ]
    }
  ]
};

export function EventForm({ defaultValues, onSubmit, isSubmitting }: EventFormProps) {
  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      name: "",
      venue: "",
      date: new Date().toISOString().split('T')[0],
      configuration: defaultConfig,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Summer Concert 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue</FormLabel>
                <FormControl>
                  <Input placeholder="Main Hall" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground">
          <p>Initial configuration will include a "Front Orchestra" zone. You can customize the seating layout in the Event Manager after creation.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Event"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
