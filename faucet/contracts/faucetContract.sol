pragma solidity >=0.8.4 <0.9.0;

contract Faucet {


    address[] public funders;

    // this function is called when no function name is specified in the call
    // external functions can only be called by other contracts and other txs
    receive() external payable { // payable tell this function will receive tokens

    }
    function addFunds() external payable {
        funders.push(msg.sender);
    }
    function getAllFunders() external view returns(address[] memory){
        return funders;
    }
}