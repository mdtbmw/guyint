
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useWallet } from '@/hooks/use-wallet';

export function WalletConnectDialog() {
  // This component is now effectively a placeholder,
  // as Web3Modal handles its own UI for wallet selection and unsupported environments.
  // We keep it in case we need a custom "Install Wallet" prompt in the future,
  // but it is no longer actively used by the useWallet hook.
  
  return (
    <Dialog open={false}>
      <DialogContent className="bg-neutral-900/80 border-neutral-700 text-white w-[85%] max-w-sm rounded-2xl backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>Web3 Wallet Required</DialogTitle>
          <DialogDescription className="text-white/60">
            This application is built on the blockchain and requires a Web3
            wallet to interact with it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-white/80">
          <p>
            A wallet (like MetaMask) is a secure browser extension that allows you to store digital assets and connect to decentralized applications like this one.
          </p>
          <p>
            Please install MetaMask or another Web3 compatible wallet to continue.
          </p>
        </div>
        <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                Install MetaMask
            </Button>
        </a>
      </DialogContent>
    </Dialog>
  );
}
