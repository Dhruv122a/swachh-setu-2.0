import { Toaster as Sonner, toast } from "sonner";

export const Toast = () => (
  <Sonner theme="dark" position="top-center" richColors closeButton
    toastOptions={{ style: { background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", fontFamily: "DM Sans" } }} />
);

export const notify = toast;
