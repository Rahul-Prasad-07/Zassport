Here’s a clean, from-scratch setup anyone can follow to get ZK circuits working in the frontend and the end-to-end flow running.

Step 0 — Prerequisites (macOS)
````bash
# Homebrew (if not installed)
 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install node git

# ZK tools
npm i -g circom snarkjs

# Clone your repo
git clone <your-repo-url>
cd Zassport
````

Step 1 — Create and compile a circuit (example: Age proof)
````bash
# Go to circuits workspace
cd circuits/age

# Put your circuit here (or use an existing one as circuit.circom)
# Compile to R1CS + WASM + symbols
circom circuit.circom --r1cs --wasm --sym
````

Step 2 — Trusted setup (use a final ptau or create one)
````bash
# If you already have a suitable final ptau (e.g., pot15_final.ptau),
# copy it into circuits/ (skip generating new ptau)

# Otherwise, generate a new Powers of Tau and finalize it
snarkjs powersoftau new bn128 15 pot15_0000.ptau
snarkjs powersoftau contribute pot15_0000.ptau pot15_final.ptau --name="initial"
````

Step 3 — Groth16 setup to produce proving and verifying keys
````bash
# Produce initial zkey
snarkjs groth16 setup circuit.r1cs ../pot15_final.ptau circuit_0000.zkey

# Optional: add a contribution (good practice)
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="contrib-1"

# Finalize with beacon
snarkjs zkey beacon circuit_0001.zkey circuit_final.zkey 0102030405060708090a

# Export verification key
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
````

Step 4 — Copy artifacts to frontend public (browser needs these 3 files)
````bash
# From circuits/age (source folder)
# WASM produced in age_js/circuit.wasm
mkdir -p ../../apps/web/public/circuits/age/v1

cp ./age_js/circuit.wasm ../../apps/web/public/circuits/age/v1/circuit.wasm
cp ./circuit_final.zkey ../../apps/web/public/circuits/age/v1/circuit_final.zkey
cp ./verification_key.json ../../apps/web/public/circuits/age/v1/verification_key.json
````

Step 5 — Add a circuits manifest (helps versioning and clean upgrades)
````json
{
  "age": {
    "version": "v1",
    "wasm": "/circuits/age/v1/circuit.wasm",
    "zkey": "/circuits/age/v1/circuit_final.zkey",
    "vkey": "/circuits/age/v1/verification_key.json"
  }
}
````

Step 6 — Frontend setup (install and run dev)
````bash
# In repo root
cd apps/web
npm install
npm run dev
# Open http://localhost:3001 (or Next default)
````

Step 7 — Verifier service (local run; required for attestation)
````bash
# From repo root
cd verifier-service
npm install
# Ensure .env has required values (e.g., VERIFIER_SECRET_KEY, PORT)
npm start
# Service should listen on http://localhost:3000
````

Step 8 — Connect frontend to verifier
````bash
# In apps/web
# Add environment variable (Vercel or local .env.local)
echo 'NEXT_PUBLIC_VERIFIER_URL=http://localhost:3000' >> .env.local

# Restart dev server if needed
npm run dev
````

Step 9 — Test the full user flow
````bash
# 1) Open frontend
# 2) Connect wallet (Phantom/Solflare)
# 3) Scan passport (camera)
# 4) Register identity (on-chain)
# 5) Generate age proof → Verify via verifier-service
# 6) Submit attestation on-chain → See claim updated
````

Step 10 — Production deploys
````bash
# Frontend (Vercel)
# - Push code
# - Ensure public/circuits/* are included
# - Set NEXT_PUBLIC_VERIFIER_URL to your deployed verifier URL

# Verifier (Render/Railway/Fly)
# - Create a Web Service from verifier-service
# - Build: npm install
# - Start: npm start
# - Add VERIFIER_SECRET_KEY, PROGRAM_ID, PORT
````

Notes and rules
- The browser always needs exactly three per circuit: circuit.wasm, circuit_final.zkey, verification_key.json.
- These are static and versioned. If you change the circuit logic, you must:
  - Recompile, regenerate zkey, export new vkey.
  - Place them under a new version folder (e.g., /v2) and update manifest.json.
- You do not rebuild artifacts for changing runtime inputs (like minAge); only when the circuit itself changes.
- Do not commit intermediate artifacts (.r1cs, circuit_0000.zkey, circuit_0001.zkey, witness.wtns) to GitHub.
- Keep potXX_final.ptau under circuits/ if you want reproducible builds, or host separately.

Optional: add .gitignore entries (to avoid committing heavy/intermediate files)
````gitignore
**/build/
**/*.r1cs
**/*_000*.zkey
**/*.wtns
**/*.log
pot*_000*.ptau
````

With this, anyone can start fresh, produce ZK artifacts, place them into the frontend, run the verifier, and complete the end-to-end flow.