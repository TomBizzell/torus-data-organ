
import { Client, Wallet } from "xrpl";

export async function createDID(walletSeed: string) {
  const client = new Client("wss://xrplcluster.com");
  await client.connect();
  
  const wallet = Wallet.fromSeed(walletSeed);
  const did = `did:xrpl:${wallet.address}`;
  
  await client.disconnect();
  return { did, address: wallet.address };
}

export async function verifyDID(did: string) {
  // Remove the prefix to get the address
  const address = did.replace('did:xrpl:', '');
  
  const client = new Client("wss://xrplcluster.com");
  await client.connect();
  
  try {
    const accountInfo = await client.request({
      command: 'account_info',
      account: address
    });
    
    await client.disconnect();
    return !!accountInfo;
  } catch (error) {
    await client.disconnect();
    return false;
  }
}
