import "./App.css";
import { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
    contract: null,
  });

  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState(null);
  const [shouldReload, reload] = useState(false);

  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload]);

  const setAccountListener = (provider) => {
    provider.on("accountsChanged", (accounts) => setAccount(accounts[0]));
  };

  useEffect(() => {
    document.title = "Faucet";
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      const contract = await loadContract("Faucet", provider);
      if (provider) {
        setAccountListener(provider);
        setWeb3Api({
          provider,
          web3: new Web3(provider),
          contract,
        });
      } else {
        // if the provider is not detected, detectEthereumProvider resolves to null
        console.log("Please install MetaMask!");
      }
    };

    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const balance = await web3.eth.getBalance(contract.address);
      console.log(balance);
      setBalance(web3.utils.fromWei(balance, "ether"));
    };

    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();

      setAccount(accounts[0]);
    };

    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api;
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });

    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  const withdrawFunds = useCallback(async () => {
    const { contract, web3 } = web3Api;
    const withdrawAmount = web3.utils.toWei("0.5", "ether");
    await contract.withdraw(withdrawAmount, {
      from: account,
    });

    reloadEffect();
  }, [web3Api, account, reloadEffect]);

  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet is-flex is-flex-direction-column is-align-items-center">
          <div className="mt-4 is-flex is-flex-direction-row is-align-items-center">
            <span>
              <strong>Account: </strong>
            </span>
            {account ? (
              <div className="ml-2">{account}</div>
            ) : (
              <button
                className="button ml-2"
                onClick={() =>
                  web3Api.provider.request({ method: "eth_requestAccounts" })
                }
              >
                Connect Metamask
              </button>
            )}
          </div>

          <div className="mt-4 balance-view is-size-2">
            Current Contract Balance: <strong>{balance}</strong> ETH
          </div>
          <div className="is-flex is-flex-direction-row is-align-items-center">
            <button className="button is-primary mr-2" onClick={addFunds}>
              Donate 1ETH
            </button>
            <button className="button is-link" onClick={withdrawFunds}>
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
