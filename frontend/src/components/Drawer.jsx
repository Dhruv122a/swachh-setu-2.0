import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

export const Drawer = ({ open, onOpenChange, title, description, children, testId }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" data-testid={testId} className="w-full overflow-y-auto border-slate-800 bg-[#0B1222] text-slate-100 sm:max-w-lg">
      <SheetHeader className="text-left">
        <SheetTitle className="font-display text-xl text-white">{title}</SheetTitle>
        {description && <SheetDescription className="text-slate-400">{description}</SheetDescription>}
      </SheetHeader>
      <div className="mt-6">{children}</div>
    </SheetContent>
  </Sheet>
);
