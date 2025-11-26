
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LifeBuoy, Wallet, Layers, CheckCircle, Database, Zap, FileLock2, HelpCircle, Library, KeyRound, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useAdmin } from '@/hooks/use-admin';

const faqs = [
    {
        question: "Is connecting my wallet safe?",
        answer: "Absolutely. Connecting your wallet is a read-only action that allows our platform to view your public address. It is cryptographically impossible for us to access your funds or perform any transactions without your explicit approval for each one within your wallet."
    },
    {
        question: "What is the $TRUST token?",
        answer: "The $TRUST token is the official utility token for the Intuition BETs platform. It functions as the native currency of the Intuition chain, meaning all staking, rewards, and transaction fees (gas) are handled using $TRUST. This provides a seamless and integrated economic engine for the entire market."
    },
    {
        question: "Who pays for gas fees and Oracle costs?",
        answer: "As with all decentralized applications, users are responsible for the network gas fees required for their own on-chain transactions (e.g., placing a stake, claiming winnings). These fees are paid in $TRUST. The platform's operational costs, such as Oracle fees for objective outcome verification, are covered by the platform's treasury."
    },
    {
        question: "How does the platform earn revenue?",
        answer: "The platform's business model is transparent and self-sustaining. We collect a small 3% fee from the winnings of each Signal. This fee is automatically sent to a secure treasury wallet and is used to fund operational costs, security audits, and future development, ensuring the long-term health and decentralization of the ecosystem."
    },
    {
        question: "Where does the event data come from?",
        answer: "Our user interface is powered by a high-performance database, which is synchronized in real-time with our on-chain smart contracts. This hybrid approach ensures you get instant updates in the UI while all critical data remains secured and validated on the blockchain as the ultimate source of truth."
    },
    {
        question: "Where do my staked funds go?",
        answer: "When you place a Stake, your $TRUST tokens are programmatically locked in a secure, audited smart contract, not held by the platform. This contract acts as an automated and impartial escrow. After a Signal concludes, it transparently and automatically distributes the entire pool to the winners according to the verifiable outcome."
    }
]

export default function HelpPage() {
  const { isAdmin } = useAdmin();

  return (
    <div className="space-y-8 animate-slide-up">
        <PageHeader
            title="Help & FAQ"
            description="Your guide to the Intuition BETs prediction market."
        />

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>What is Intuition BETs?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Intuition BETs is a premier, fully-decentralized prediction market that empowers users to capitalize on their real-world knowledge and foresight by betting on event outcomes with the official **$TRUST token**. Built on a foundation of immutable smart contracts and a secure backend, every stake, outcome, and payout is executed with maximum transparency, security, and efficiency.
          </p>
        </CardContent>
      </Card>

       <Card className="glass-panel">
        <CardHeader>
          <CardTitle>How It Works: The Path to Winning</CardTitle>
          <CardDescription>A powerful, four-step process to capitalize on your insight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Wallet className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-semibold">1. Connect Securely</h3>
                    <p className="text-sm text-muted-foreground">Authorize your Web3 wallet (e.g., MetaMask) to securely interact with our platform. Your wallet is your private, sovereign identity—no emails or passwords required.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Layers className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-semibold">2. Stake Your Conviction</h3>
                    <p className="text-sm text-muted-foreground">Analyze active markets. When you've made your call, stake your **$TRUST** tokens on a "YES" or "NO" outcome and sign the on-chain transaction.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Library className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-semibold">3. The Winner's Pool</h3>
                    <p className="text-sm text-muted-foreground">All stakes are locked in the Signal's immutable smart contract. Winners proportionally split the tokens from the losing side. A small 3% platform fee on winnings ensures operational longevity.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <CheckCircle className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-semibold">4. Automated Resolution & Payout</h3>
                    <p className="text-sm text-muted-foreground">A decentralized Chainlink Oracle provides the definitive, real-world Signal outcome. If your prediction was correct, the "Claim Winnings" function becomes available for you to execute and collect your payout directly into your wallet.</p>
                </div>
            </div>
        </CardContent>
      </Card>
      
      {isAdmin && (
        <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileLock2 /> Understanding Addresses &amp; Keys</CardTitle>
              <CardDescription>A critical guide for secure platform administration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <Building className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Contract Address</h3>
                        <p className="text-sm text-muted-foreground">This is the public address of the smart contract itself. It is configured once in the app's `.env` file and tells the frontend where to find the application logic on the blockchain. Think of it as the public street address of the entire platform.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <Wallet className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Admin Wallet Address</h3>
                        <p className="text-sm text-muted-foreground">This is the public address of the administrator's account. It's used for logging in and identifying who has permission to perform admin actions. The smart contract contains a rule stating, "Only this address is the admin."</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <KeyRound className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Admin Private Key</h3>
                        <p className="text-sm text-muted-foreground">This is a **top-secret** key used only once to import the Admin Wallet into a secure wallet like MetaMask. It must never be shared or stored in code. It's the ultimate proof of ownership for the admin account, used by MetaMask to sign and authorize transactions.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

       <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle /> Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.sort((a, b) => a.question.localeCompare(b.question)).map((faq, i) => (
                    <AccordionItem value={`item-${i}`} key={i}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>
                           {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
