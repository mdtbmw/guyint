# **App Name**: Intuition BETs UI

## Core Features:

- Connect Wallet & User Profile: Connect an EVM-compatible wallet to the dApp using Metamask or similar. The connected wallet address serves as the user's identity. Users can optionally create a profile tied to their wallet, including a nickname/username, avatar (even NFTs as PFPs), and short bio. Gamification elements like an "Intuition Score" can be added, based on accuracy percentage.
- View Games/Events & Subscriptions: Display available betting events, showing the event question, possible outcomes (YES/NO), and any relevant details. Users can subscribe to event categories (e.g., Crypto Events, Sports, Global Politics) and get notifications when new events drop.
- Stake TTRUST & Pool Display: Allow users to place bets on an event's outcome using TTRUST tokens, with clearly defined minimum (0.05) and maximum (0.2) stake limits. Stakes are managed via smart contracts. Show a pool progress bar displaying total staked and the breakdown of YES/NO.
- Results & Winnings: Once the winning outcome is declared, display the results and allow winning users to claim their original stake plus a share of the losing pool. Losers forfeit their stakes. Consider an optional advanced feature for partial cashout before the result is declared, allowing users to sell their bet at a discounted rate.
- Refunds: If an event is canceled, provide a Refund button for users to claim a full refund of their stake.
- Betting History: Provide a history log showing past bets, outcomes, and amounts staked by the user.
- Admin Role Separation & Audit Log: Implement multi-admin roles, including Super Admin (deploy contracts, add/remove admins), Event Creator Admins (create/cancel events), and Oracle Admins (declare outcomes). Every action an admin takes (create, cancel, declare outcome) is recorded on-chain and viewable in the dApp UI via an Admin Audit Log.

## Style Guidelines:

- Primary color: Saturated blue (#4285F4) to evoke trust and stability.
- Background color: Light gray (#F5F5F5), a desaturated version of the primary, provides a neutral backdrop.
- Accent color: Yellow (#FFC107), an analogous color to the primary but higher in saturation and brightness, used for CTAs.
- Body and headline font: 'Inter', a sans-serif font offering a modern, objective look for clear readability and consistent branding.
- Simple, geometric icons to represent event categories and actions, ensuring ease of understanding and a clean interface.
- Clean and structured layout with clear divisions between sections to enhance usability and highlight key information.
- Subtle transitions and animations on button hovers and content updates to provide feedback and improve user engagement.