import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageWrapper } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContactSupport, contactSchema } from "@/hooks/use-mock-api";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Loader2 } from "lucide-react";
import * as z from "zod";

export default function Support() {
  const { toast } = useToast();
  const support = useContactSupport();
  
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" }
  });

  const onSubmit = (data: z.infer<typeof contactSchema>) => {
    support.mutate(data, {
      onSuccess: (res) => {
        toast({ title: "Message Sent", description: res.message });
        form.reset();
      }
    });
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold font-display text-primary">Support</h1>
            <p className="text-xl text-muted-foreground">
              Have questions or need help with any selectNsolve™ product? We're here for you.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Email Us</h3>
                <p>support@myengineeringproject.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Community Forums</h3>
                <p>Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Name</label>
                <Input placeholder="Your name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input type="email" placeholder="you@example.com" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Subject</label>
                <Input placeholder="How can we help?" {...form.register("subject")} />
                {form.formState.errors.subject && <p className="text-destructive text-sm">{form.formState.errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Message</label>
                <Textarea placeholder="Describe your issue..." {...form.register("message")} />
                {form.formState.errors.message && <p className="text-destructive text-sm">{form.formState.errors.message.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={support.isPending}>
                {support.isPending ? <><Loader2 className="mr-2 animate-spin" /> Sending...</> : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
