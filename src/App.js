import "./App.css";
import { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });

  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState(null);
  const [shouldReload, reload] = useState(false);

  const canConnectToContract = account && web3Api.contract;

  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload]);

  const setAccountListener = (provider) => {
    provider.on("accountsChanged", (_) => window.location.reload());
    provider.on("chainChanged", (_) => window.location.reload());

    /*provider._jsonRpcConnection.events.on("notification", payload => {
      const { method } = payload;

      if (method === "metamask_unlockStateChange") {
        setAccount(null);
      }
    });*/
  };

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const contract = await loadContract("Faucet", provider);
        setAccountListener(provider);
        setWeb3Api({
          provider,
          isProviderLoaded: true,
          web3: new Web3(provider),
          contract,
        });
      } else {
        setWeb3Api({ ...web3Api, isProviderLoaded: true });
        console.log("Please install MetaMask!");
      }
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
          {web3Api.isProviderLoaded ? (
            <>
              <div className="mt-4 is-flex is-flex-direction-row is-align-items-center">
                <span>
                  <strong>Account: </strong>
                </span>
                {account ? (
                  <div className="ml-2">{account}</div>
                ) : !web3Api.provider ? (
                  <>
                    <div className="notification is-warning is-rounded">
                      Wallet is not detected!
                      <a
                        className="ml-2"
                        target="_blank"
                        href="https://metamask.io/download/"
                        rel="noreferrer"
                      >
                        Install Metamask
                      </a>
                    </div>
                  </>
                ) : (
                  <button
                    className="button ml-2"
                    onClick={() =>
                      web3Api.provider.request({
                        method: "eth_requestAccounts",
                      })
                    }
                  >
                    Connect Metamask
                  </button>
                )}
              </div>
              <div className="mt-4 balance-view is-size-2">
                Current Contract Balance: <strong>{balance}</strong> ETH
              </div>
              {!canConnectToContract && account ? (
                <i className="is-block mb-2">
                  Wrong network. Connect to Ganache.
                </i>
              ): <></>}
              <div className="is-flex is-flex-direction-row is-align-items-center">
                <button
                  className="button is-primary mr-2"
                  onClick={addFunds}
                  disabled={!canConnectToContract}
                >
                  Donate 1ETH
                </button>
                <button
                  className="button is-link"
                  onClick={withdrawFunds}
                  disabled={!canConnectToContract}
                >
                  Withdraw
                </button>
              </div>
            </>
          ) : (
            <span>Loading web3...</span>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
