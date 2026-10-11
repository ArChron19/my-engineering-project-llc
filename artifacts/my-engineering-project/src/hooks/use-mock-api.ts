import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

// Simulated delay for realistic interactions
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function useContactSupport() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      await delay(1200);
      console.log("Support request sent:", data);
      return { success: true, message: "Support request sent successfully!" };
    },
  });
}

