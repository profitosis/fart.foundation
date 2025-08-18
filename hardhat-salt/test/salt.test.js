const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SaltToken + SaltFarm integration", function () {
  it("attestor signs -> mint -> stake -> redeem", async function () {
    const [deployer, user] = await ethers.getSigners();
    const attestorWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const SaltToken = await ethers.getContractFactory("SaltToken");
    const salt = await SaltToken.deploy(attestorWallet.address);
    await salt.deployed();

    const SaltFarm = await ethers.getContractFactory("SaltFarm");
    const farm = await SaltFarm.deploy();
    await farm.deployed();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const lp = await MockERC20.deploy("LP", "LPT");
    await lp.deployed();
    const mintAmt = ethers.utils.parseUnits("1000", 18);
    await lp.mint(user.address, mintAmt);

    // build attestation
    const to = user.address;
    const amt = ethers.utils.parseUnits("10", 18);
    const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const ipfsCid = "ipfs://bafy...";

    const encoded = ethers.utils.solidityPack(
      ["address","uint256","bytes32","string"],
      [to, amt, merkleRoot, ipfsCid]
    );
    const hash = ethers.utils.keccak256(encoded);
    const signature = await attestorWallet.signMessage(ethers.utils.arrayify(hash));

    // mint with attestation
    await salt.mintWithAttestation(to, amt, merkleRoot, ipfsCid, signature);
    expect((await salt.balanceOf(to)).toString()).to.equal(amt.toString());

    // user approves and stakes LP
    await lp.connect(user).approve(farm.address, mintAmt);
    const stakeAmt = ethers.utils.parseUnits("50", 18);
    await farm.connect(user).stakeLPAndMint(lp.address, stakeAmt, merkleRoot, "https://meta/1.json");
    const id = (await farm.nextId()).toNumber() - 1;
    expect(await farm.ownerOf(id)).to.equal(user.address);

    // redeem
    await farm.connect(user).redeem(id);
    // after redeem user should have received LP back (>= initial stake)
    const finalLP = await lp.balanceOf(user.address);
    expect(finalLP.gte(stakeAmt)).to.be.true;
  });
});

