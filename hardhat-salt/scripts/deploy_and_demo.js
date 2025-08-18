// scripts/deploy_and_demo.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer, user] = await ethers.getSigners();
  console.log("Deployer:", deployer.address, "User:", user.address);

  // 1) Create an attestor (in production, attestor is off-chain HSM signer)
  const attestorWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log("Attestor address (simulated):", attestorWallet.address);

  // 2) Deploy SaltToken with attestor address
  const SaltToken = await ethers.getContractFactory("SaltToken");
  const salt = await SaltToken.deploy(attestorWallet.address);
  await salt.deployed();
  console.log("SaltToken deployed:", salt.address);

  // 3) Deploy SaltFarm
  const SaltFarm = await ethers.getContractFactory("SaltFarm");
  const farm = await SaltFarm.deploy();
  await farm.deployed();
  console.log("SaltFarm deployed:", farm.address);

  // 4) Deploy Mock LP token and mint LP tokens to user
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const lp = await MockERC20.deploy("LP Token", "LPT");
  await lp.deployed();
  console.log("Mock LP token:", lp.address);

  // Mint some LP tokens to user
  const mintAmount = ethers.utils.parseUnits("1000", 18);
  await lp.mint(user.address, mintAmount);
  console.log("Minted LP to user:", user.address);

  // 5) Attestor signs a mint attestation off-chain (simulate)
  const to = user.address;
  const amt = ethers.utils.parseUnits("50", 18); // amount of ST to mint
  const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const ipfsCid = "ipfs://bafy...dummy";
  // compute keccak256(abi.encodePacked(to, amt, merkleRoot, ipfsCid))
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encoded = ethers.utils.solidityPack(
    ["address", "uint256", "bytes32", "string"],
    [to, amt, merkleRoot, ipfsCid]
  );
  const hash = ethers.utils.keccak256(encoded);
  // attestor signs the hash (eth_sign semantics)
  const signature = await attestorWallet.signMessage(ethers.utils.arrayify(hash));
  console.log("Signature:", signature);

  // 6) Call mintWithAttestation from any caller (user or deployer)
  await salt.connect(deployer).mintWithAttestation(to, amt, merkleRoot, ipfsCid, signature);
  console.log("Minted ST to user:", to, "amt:", ethers.utils.formatUnits(amt,18));
  const userBal = await salt.balanceOf(to);
  console.log("User ST balance:", ethers.utils.formatUnits(userBal,18));

  // 7) User approves farm to transfer LP and stake
  // Use user as signer (impersonate)
  await lp.connect(user).approve(farm.address, mintAmount);
  // stake 100 LP into farm by user
  const stakeAmount = ethers.utils.parseUnits("100", 18);
  // We need to call farm.stakeLPAndMint from user
  // Since we are in script with 2 signers, ensure user performs the call
  const farmWithUser = farm.connect(user);
  const tx = await farmWithUser.stakeLPAndMint(lp.address, stakeAmount, merkleRoot, "https://metadata.example/srec/1.json");
  const rcpt = await tx.wait();
  console.log("Staked LP and minted receipt. tx:", rcpt.transactionHash);

  // Query the minted receipt id by reading nextId - 1
  const nextId = await farm.nextId();
  const mintedId = nextId.toNumber() - 1;
  console.log("Receipt NFT id:", mintedId);
  const ownerOf = await farm.ownerOf(mintedId);
  console.log("Owner of receipt:", ownerOf);

  // 8) Redeem (user calls redeem)
  await farmWithUser.redeem(mintedId);
  console.log("Redeemed receipt; underlying LP returned to user.");
  const finalBalance = await lp.balanceOf(user.address);
  console.log("User LP final balance:", ethers.utils.formatUnits(finalBalance,18));
}

main().catch((err) => { console.error(err); process.exit(1); });

