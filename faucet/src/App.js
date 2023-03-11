import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";
import { InputNumber } from 'primereact/inputnumber';
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";     
import { Toast } from 'primereact/toast';

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });
   const [amount, setValue3] = useState(0.01);

  const [balance, setBalance] = useState(null);
  const [account, setAccounts] = useState(null);
  const [shouldReload, reload] = useState(false);

  const canConnectToContract = account && web3Api.contract  
  const reloadEffect = useCallback(() => reload(!shouldReload),[shouldReload])

  const setAccountListener = provider => {
    provider.on("accountsChanged", accounts => setAccounts(accounts[0]))
    provider.on("chainChanged", _ => window.location.reload())
  }

  const toast = useRef(null);

  useEffect(() => {
    const loadProvider = async () => {
      const chainId = "43113"
      const provider = await detectEthereumProvider();
      if (provider && window.ethereum.networkVersion === chainId) {
        const contract = await loadContract("Faucet", provider);
        //await provider.request({ method: "eth_requestAccounts" })
        setAccountListener(provider)
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true
        });
      } 
      else if (provider && window.ethereum.networkVersion !== chainId){
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(chainId) }]
          }).then(() =>{
            loadProvider()
          })
        } catch (err) {
          // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {

              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainName: 'Avalanche Testnet',
                    chainId: Web3.utils.toHex(chainId),
                    nativeCurrency: { name: 'AVAX', decimals: 18, symbol: 'AVAX' },
                    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc']
                  }
                ]
              });
          }
        }
      }
      else {
        // setWeb3Api({...web3Api, isProviderLoaded:true})
        setWeb3Api(api => ({
            ...api,
            isProviderLoaded:true
          }
        ))
        console.error("Please install metamask");
      }

      // if (window.ethereum) {
      //   provider = window.ethereum;

      //   try {
      //     await provider.request({ method: "eth_requestAccounts" });
      //   } catch {
      //     console.error("User denied account access!");
      //   }
      // } else if (window.web3) {
      //   provider = window.web3.currentProvider;
      // } else if (!process.env.production) {
      //   provider = new Web3.providers.HttpProvider(
      //     "https://api.avax-test.network/ext/bc/c/rpc"
      //   );
      // }
    };
    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const balance = await web3.eth.getBalance(contract.address);
      setBalance(web3.utils.fromWei(balance, "ether"));
    };
    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccounts(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  const addFunds = useCallback( async () => {
    const { contract } = web3Api
    await contract.addFunds({
      from: account,
      value: Web3.utils.toWei(`${amount}`, "ether")
    })
    reloadEffect()
  }, [web3Api, account, amount, reloadEffect])

  const withdrawFunds = useCallback(async () => {
    const {contract} = web3Api
    const withdrawAmount = Web3.utils.toWei(`${amount}`, "ether")
    try {
      await contract.withdraw(withdrawAmount, {
        from: account
      })
    } catch (error) {
      console.log(error)
      showError()
    }
    reloadEffect()
  }, [web3Api, account, amount, reloadEffect])

  const showError = () => {
        toast.current.show({severity:'error',  detail:'Somente o deployer pode fazer o saque :P', life: 3000});
    }


    return (
      
      <div className="faucet-wrapper">
      <div className="faucet">
        { web3Api.isProviderLoaded ?
        <div className="is-flex is-align-items-center">
          <span>
            <strong className="mr-2">Endereço:</strong>
          </span>
          {account ? 
            <div>{account}</div> 
           : !web3Api.provider ?
            <div className="notification is-warning is-size-6 is-rounded">
              Carteira não detectada!
              <a rel="noreferrer" target="_blank" href="https://docs.metamask.io">
                Instale a Metamask
              </a>

            </div> :

            <button
              onClick={() =>
                web3Api.provider.request({ method: "eth_requestAccounts" })
              }
              className="button is-info is-small"
            >
              Conectar carteira
            </button>
          }
        </div> :
        <span>Looking for web3...</span>
        }
        <div className="balance-view is-size-2 my-4">
          Saldo no contrato: <strong>{balance}</strong>AVAX
        </div>
        { !canConnectToContract && <i className="is-block">Conecte-se a rede Avax Fuji Testnet</i>

        }
        {/* <button
          className="btn mr-2"
          onClick={async () => {
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            console.log(accounts);
          }}
        >
          Enable ethereum
        </button> */}
        <InputNumber value={amount} style={{'marginRight': '10px'}} onValueChange={(e) => setValue3(e.value)} minFractionDigits={0} maxFractionDigits={8} />
        <button disabled={!canConnectToContract} className="button is-primary is-light mr-2" onClick={addFunds}>Doar </button>
        <button disabled={!canConnectToContract} className="button is-danger is-light" onClick={withdrawFunds}>Sacar</button>
        <Toast ref={toast}></Toast>
      </div>
    </div>
    
  );
}

export default App;
