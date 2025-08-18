Hardhat Salt demo
=================

Quickstart (local dev):

1. Install dependencies:
   npm install

2. Run tests (Hardhat node simulated attestor):
   npx hardhat test

3. Demo script (deploy to local Hardhat network and run flow):
   npx hardhat node &    # in separate terminal, optionally
   node scripts/deploy_and_demo.js

Security notes:
 - The "attestor" in tests is a simulated ephemeral wallet. In production use an HSM or KMS to sign attestations.
 - Do not store production private keys in plaintext. Rotate keys, require multisig for critical operations.
 - This code mints tokens on request if signature verifies the attestor — ensure attestor only signs after off-chain verification.
 - This example is for test/dev only. Audit contracts before mainnet/real deployments.

