# Zassport Demo Script

## 🎬 Demo Video Flow (5-7 minutes)

### Part 1: Introduction (30 seconds)
**[Screen: Landing page]**

"Hi, I'm presenting Zassport - a privacy-preserving passport verification system built on Solana.

The problem: Today's identity verification systems require you to share ALL your personal data - your full name, birthdate, passport number, photo - even when you only need to prove one simple fact like 'I'm over 18.'

Zassport solves this using zero-knowledge proofs. You can prove facts about your passport without revealing the underlying data."

---

### Part 2: Architecture Overview (45 seconds)
**[Screen: Architecture diagram]**

"Here's how it works:

1. Your smartphone reads your passport's NFC chip - this data never leaves your device
2. Locally, we generate a zero-knowledge proof - a mathematical proof that validates your claim
3. Only this proof goes on-chain to Solana - your personal data stays private
4. Smart contracts verify the proof and record your verified identity

We're using three key technologies:
- Solana for fast, cheap blockchain transactions
- Circom for zero-knowledge circuit development
- React Native for mobile NFC scanning"

---

### Part 3: Web App Demo (90 seconds)
**[Screen: Web application]**

"Let me show you the web interface.

**[Click 'Connect Wallet']**
First, I connect my Solana wallet.

**[Navigate to proof generator]**
Here's our interactive proof generator. I can enter passport data - in production, this comes from the NFC scan.

**[Select 'Age Proof (18+)']**
Let's prove I'm over 18 without revealing my birthdate.

**[Click 'Generate Proof']**
The system generates the proof locally... and done! 

**[Show proof output]**
Here's the zero-knowledge proof - notice it only reveals 'isOldEnough: true' but NOT my actual birthdate.

**[Click 'Verify On-Chain']**
Now I submit this to Solana... and it's verified!

The blockchain now knows I'm over 18, but my birthdate remains completely private."

---

### Part 4: Mobile App Demo (90 seconds)
**[Screen: Mobile simulator/device]**

"Now the exciting part - our mobile app.

**[Open app]**
This is built with React Native and Expo.

**[Go to Scan tab]**
On the scan screen, users can read their passport's NFC chip directly.

**[Tap 'Scan Passport']**
In a real scenario, you'd hold your phone to the passport chip...

**[Show scanned data]**
And here's the extracted data - document number, name, nationality, all read from the secure chip.

**[Tap 'Generate ZK Proofs']**
Now I can generate multiple proofs: age verification, nationality proof, document validity...

**[Show Proofs tab]**
All my generated proofs are stored locally and can be submitted to the blockchain whenever needed.

**[Show Profile tab]**
My profile shows my reputation score - I earn reputation by generating valid proofs and participating in governance."

---

### Part 5: Governance Demo (60 seconds)
**[Screen: Governance page]**

"Zassport is community-governed.

**[Show active proposals]**
Here are active proposals - like adding new countries to the approved list.

**[Show proposal details]**
Each proposal shows voting options, current results, and time remaining.

**[Cast a vote]**
My vote weight is proportional to my reputation score - this prevents spam and rewards active contributors.

**[Show leaderboard]**
The reputation leaderboard shows top contributors. High reputation means more governance power.

**[Show 'Create Proposal']**
Anyone can create proposals to upgrade the protocol, add features, or change parameters."

---

### Part 6: Technical Deep Dive (45 seconds)
**[Screen: Code/Terminal]**

"Let me show you the tech under the hood.

**[Show Circom circuit]**
This is our age proof circuit - 612 constraints that mathematically prove your age without revealing your birthdate.

**[Show smart contract]**
Here's our Solana program - it verifies proofs on-chain and manages identities.

**[Show Solana Explorer]**
And here's our deployed contract on Solana devnet - fully functional and ready to use."

---

### Part 7: Use Cases & Impact (45 seconds)
**[Screen: Use case slides]**

"The applications are endless:

**DeFi**: Prove you're from an approved country for compliance without KYC
**Age-Gated Content**: Access 18+ content without revealing your birthdate  
**DAO Voting**: Prove citizenship for governance without doxxing yourself
**Compliance**: Satisfy regulations while preserving user privacy

This is especially powerful for emerging markets where privacy is a luxury, not a given."

---

### Part 8: Closing (30 seconds)
**[Screen: Landing page with stats]**

"In summary:

✅ Working smart contracts deployed on Solana devnet
✅ Three ZK circuits with 474-612 constraints each
✅ Mobile app with NFC scanning capability
✅ Complete governance system
✅ Privacy-first architecture

Zassport proves that privacy and verification aren't opposites - they can coexist.

Thank you, and privacy is a human right!"

---

## 📋 Pre-Demo Checklist

### Technical Setup
- [ ] Web app running on localhost:3000
- [ ] Mobile app running on Expo Go
- [ ] Wallet funded with devnet SOL
- [ ] Test passport data prepared
- [ ] All proofs pre-generated for backup
- [ ] Solana Explorer tab open with contract address

### Recording Setup
- [ ] Screen recording software ready (OBS, QuickTime)
- [ ] Microphone tested and working
- [ ] Close unnecessary apps/tabs
- [ ] Turn off notifications
- [ ] Prepare mobile device for recording
- [ ] Have slides ready for architecture explanation

### Content Preparation
- [ ] Practice run-through (at least 3x)
- [ ] Time each section
- [ ] Prepare backup screens if live demo fails
- [ ] Have talking points written down
- [ ] Prepare Q&A answers

---

## 🎤 Key Talking Points

### Privacy Focus
"Your passport data NEVER leaves your device. Only mathematical proofs go on-chain."

### Technical Innovation
"We're combining Solana's speed with Circom's privacy - best of both worlds."

### Real-World Ready
"This isn't a prototype - we have deployed contracts, working circuits, and a mobile app."

### Market Opportunity
"Every DeFi protocol, every DAO, every age-gated service needs compliant identity verification."

### Community Governance
"The protocol is owned by its users through on-chain governance with reputation-weighted voting."

---

## 🎯 Demo Tips

### Do's ✅
- Speak clearly and enthusiastically
- Show actual working features
- Highlight unique innovations
- Emphasize privacy guarantees
- Show the code and contracts
- Mention real use cases

### Don'ts ❌
- Don't apologize for missing features
- Don't spend too long on setup
- Don't dive too deep into math
- Don't badmouth competitors
- Don't make promises you can't keep
- Don't exceed time limit

---

## 🐛 Backup Plans

### If Web App Crashes
→ Show pre-recorded video or screenshots
→ Explain the feature verbally with slides

### If Mobile App Fails
→ Use iOS simulator screen recording
→ Show component code instead

### If Blockchain Is Down
→ Show transaction on Solana Explorer
→ Demonstrate local proof generation

### If ZK Proofs Don't Generate
→ Use pre-generated proofs from file
→ Explain the process with circuit diagram

---

## 📞 Q&A Preparation

### Expected Questions

**Q: How do you handle passport expiration?**
A: The proof includes validity timestamps. Expired passports generate invalid proofs.

**Q: What about fake passports?**
A: We verify the RSA signature from the issuing country's public key. Fake passports won't have valid signatures.

**Q: Can this work with other documents?**
A: Absolutely! The architecture supports any ICAO-compliant document - driver's licenses, national IDs, etc.

**Q: What's the cost per verification?**
A: ~5,000 lamports (~$0.001) on Solana. Much cheaper than traditional KYC.

**Q: How do you protect against replay attacks?**
A: We use nullifiers - unique hashes that prevent the same proof from being used twice.

**Q: What about the trusted setup?**
A: We used Groth16 with a proper powers-of-tau ceremony. For production, we'd do a multi-party computation.

---

## 🎬 Recording Settings

### Screen Recording (OBS)
- Resolution: 1920x1080
- Frame rate: 60fps
- Bitrate: 5000 kbps
- Audio: 192 kbps, 48kHz

### Video Export
- Format: MP4 (H.264)
- Max file size: 500MB
- Include subtitles for accessibility

---

**Good luck! You've built something amazing. Show it with confidence!** 🚀
