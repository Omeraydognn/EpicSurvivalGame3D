import { ethers } from 'ethers';

export class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isFuji = false;
        
        // Avalanche Fuji Testnet Configurations
        this.fujiChainIdHex = '0xa869'; // 43113 in hex
        this.fujiConfig = {
            chainId: this.fujiChainIdHex,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18
            },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://testnet.snowtrace.io/']
        };
    }

    async connect() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Initialize Ethers provider
                this.provider = new ethers.BrowserProvider(window.ethereum);
                
                // Request account access
                const accounts = await this.provider.send("eth_requestAccounts", []);
                this.account = accounts[0];
                this.signer = await this.provider.getSigner();

                // Check and switch to Fuji Testnet
                await this.checkAndSwitchToFuji();
                
                return this.account;
            } catch (error) {
                console.error("Wallet connection failed:", error);
                throw error;
            }
        } else {
            alert("Lütfen bir Web3 Cüzdanı yükleyin (örn: Core veya MetaMask)!");
            throw new Error("No crypto wallet found");
        }
    }

    async checkAndSwitchToFuji() {
        const network = await this.provider.getNetwork();
        
        // Check if current network is not Fuji (43113)
        if (network.chainId !== 43113n) {
            try {
                // Try switching to Fuji
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.fujiChainIdHex }],
                });
            } catch (switchError) {
                // If the network is not added to the wallet, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [this.fujiConfig],
                        });
                    } catch (addError) {
                        console.error("Could not add Fuji testnet", addError);
                        throw addError;
                    }
                } else {
                    console.error("Could not switch to Fuji testnet", switchError);
                    throw switchError;
                }
            }
        }
        this.isFuji = true;
        console.log("Connected to Avalanche Fuji Testnet!");
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}
