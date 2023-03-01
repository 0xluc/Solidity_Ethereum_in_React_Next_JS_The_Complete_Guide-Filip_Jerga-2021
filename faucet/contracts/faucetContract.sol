pragma solidity >=0.8.0 <0.9.0;

contract Faucet {
    // this function is called when no function name is specified in the call
    // external functions can only be called by other contracts and other txs
    receive() external payable { // payable tell this function will receive tokens

    }
}