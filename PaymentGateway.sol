// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PaymentGateway
 * @dev A simple contract to receive Celo (or other EVM) payments.
 * It emits an event with details of the payment.
 */
contract PaymentGateway {
    
    // The wallet address that will receive the funds
    address payable public owner;

    // Event to notify when a payment is received
    event PaymentReceived(address from, uint256 amount, string message);

    /**
     * @dev Sets the contract deployer as the owner.
     */
    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev The main payment function.
     * 'payable' allows this function to receive Celo.
     * 'external' means it can only be called from outside the contract.
     * @param _message A note or invoice ID for the payment.
     */
    function makePayment(string memory _message) external payable {
        // Require that some Celo is sent
        require(msg.value > 0, "Payment amount must be greater than zero");

        // Transfer the received Celo to the owner's address
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Payment transfer failed");

        // Emit an event to log the payment
        emit PaymentReceived(msg.sender, msg.value, _message);
    }

    /**
     * @dev A fallback function to receive Celo sent directly to the contract.
     */
    receive() external payable {
        makePayment("Direct transfer");
    }

    /**
     * @dev Allows the owner to withdraw the contract's entire balance.
     * (Good practice in case Celo is sent directly without calling makePayment)
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}