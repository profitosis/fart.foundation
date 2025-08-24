# fart.foundation

fart scientific community discovery terminal

## HDaaS Tokenomics Prototype

This repository now includes a conceptual prototype of the Heat Death as a
Service (HDaaS) tokenomics pipeline. The `hdaas_tokenomics.py` module simulates
how continuous audio input could be transformed into liquidity via "Salt Tokens".
The implementation uses random noise to emulate audio capture and runs a single
entropy-to-liquidity cycle.

Run the prototype:

```bash
python hdaas_tokenomics.py
```

This will print the amount of Chaos Units detected, the Salt Tokens minted
(after any collapse and recurrence), and the resulting simulated liquidity.
