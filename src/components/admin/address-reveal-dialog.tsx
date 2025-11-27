
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Copy } from "lucide-react";
import QRCode from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface AddressRevealDialogProps {
  address: string;
}

export function AddressRevealDialog({ address }: AddressRevealDialogProps) {
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address Copied" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Eye className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>User Wallet Address</DialogTitle>
          <DialogDescription>
            This is the user's full public wallet address on the Intuition chain.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="bg-background p-3 rounded-lg border">
                <QRCode
                    value={address}
                    size={128}
                    bgColor="hsl(var(--background))"
                    fgColor="hsl(var(--foreground))"
                    level="H"
                />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border w-full">
                <p className="text-sm font-mono text-foreground break-all flex-1">{address}</p>
                <Button size="icon" variant="ghost" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
