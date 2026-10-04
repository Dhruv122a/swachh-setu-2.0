import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

export const Modal = ({ open, onOpenChange, title, description, children, testId }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent data-testid={testId} className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        {description && <DialogDescription className="text-slate-400">{description}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);
