
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWallet } from "@/hooks/use-wallet";
import { WifiOff } from 'lucide-react';
import { activeChain } from "@/lib/chains";

export function NetworkSwitcher() {
  const { wrongNetwork, switchChain } = useWallet();

  const handleSwitch = () => {
    switchChain();
  };

  return (
    <AlertDialog open={wrongNetwork}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center mb-4">
             <WifiOff className="w-6 h-6 text-destructive" />
          </div>
          <AlertDialogTitle>Unsupported Network</AlertDialogTitle>
          <AlertDialogDescription>
            Your wallet is currently connected to an unsupported network. Please switch to the **{activeChain.name}** to continue using INTUITION BETs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction onClick={handleSwitch}>
          Switch to {activeChain.name}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
