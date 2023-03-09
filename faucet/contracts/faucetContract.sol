pragma solidity >=0.8.4 <0.9.0;

contract Faucet {

    address private owner;

    constructor() {
        owner = msg.sender;
    }

    uint public numOfFunders;
    // one mapping will store the funders address as keys, preventing duplicates
    // the other will store them as a copy of those keys, mapped by numbers
    mapping(address => bool) private funders; 
    mapping(uint => address) private lutFunders; // look up table

    // this function is called when no function name is specified in the call
    // external functions can only be called by other contracts and other txs
    receive() external payable { // payable tell this function will receive tokens
        addFunds();
    }
    // adds to the funders mapping any address that sends eth to this contract  
    function addFunds() public payable {
        address funder = msg.sender;
        // dont add address to funders if it was already added
        if (!funders[funder]){
            uint index = numOfFunders++;
            funders[funder] = true;
            lutFunders[index] = funder;
        }
    }

    function getFundersAtIndex(uint8 index) external view returns(address){
        return lutFunders[index];
    }
    function getAllFunders() external view returns(address[] memory) {
        address[] memory _funders = new address[](numOfFunders);
        for (uint256 index = 0; index < numOfFunders; index++) {
            _funders[index] = lutFunders[index];
        }
        return _funders;

    }
    // get back the money
    function withdrawAllFundsToAddress(address _address) external onlyAdmin() {
        payable(_address).transfer(address(this).balance);
    }
    function withdraw(uint amount) external onlyAdmin(){
        require(amount <= address(this).balance, "Not enough eth in the contract");
        payable(msg.sender).transfer(amount);
    }
    modifier onlyAdmin() {
        require(msg.sender == owner, "you are not the owner");
        _;
    }
}