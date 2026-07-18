// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Admon
 * @notice A wallet-bound, GitHub-verified build-history NFT for Monad.
 * @dev The trusted authorizer only signs after a GitHub OAuth check. This
 * prevents callers from minting an arbitrary public GitHub username directly.
 */
contract Admon is ERC721, EIP712, Ownable {
    using ECDSA for bytes32;

    bytes32 private constant MINT_TYPEHASH =
        keccak256(
            "Mint(address recipient,string username,bytes32 traitsHash,string tokenURI,uint256 deadline)"
        );

    uint256 private _nextTokenId;
    address public authorizedSigner;
    string private _baseTokenURI;

    mapping(string => uint256) public tokenIdByUsername;
    mapping(uint256 => string) public usernameByTokenId;
    mapping(uint256 => bytes32) public traitsHashOf;
    mapping(uint256 => string) private _tokenURIs;

    event CarMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string username,
        bytes32 traitsHash
    );
    event AuthorizedSignerUpdated(address indexed signer);

    error UsernameAlreadyMinted(string username);
    error EmptyUsername();
    error EmptyTraitsHash();
    error AuthorizationExpired();
    error InvalidMintAuthorization();
    error InvalidAuthorizedSigner();

    constructor(string memory initialBaseURI, address initialAuthorizedSigner)
        ERC721("Admon", "ADMON")
        EIP712("Admon", "1")
        Ownable(msg.sender)
    {
        if (initialAuthorizedSigner == address(0)) revert InvalidAuthorizedSigner();
        _baseTokenURI = initialBaseURI;
        authorizedSigner = initialAuthorizedSigner;
    }

    function mint(
        string calldata username,
        bytes32 traitsHash,
        string calldata tokenURI_,
        uint256 deadline,
        bytes calldata authorization
    ) external returns (uint256) {
        if (bytes(username).length == 0) revert EmptyUsername();
        if (traitsHash == bytes32(0)) revert EmptyTraitsHash();
        if (tokenIdByUsername[username] != 0) revert UsernameAlreadyMinted(username);
        if (block.timestamp > deadline) revert AuthorizationExpired();

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                msg.sender,
                keccak256(bytes(username)),
                traitsHash,
                keccak256(bytes(tokenURI_)),
                deadline
            )
        );
        if (_hashTypedDataV4(structHash).recover(authorization) != authorizedSigner) {
            revert InvalidMintAuthorization();
        }

        uint256 tokenId = ++_nextTokenId;
        tokenIdByUsername[username] = tokenId;
        usernameByTokenId[tokenId] = username;
        traitsHashOf[tokenId] = traitsHash;
        if (bytes(tokenURI_).length > 0) _tokenURIs[tokenId] = tokenURI_;

        _safeMint(msg.sender, tokenId);
        emit CarMinted(msg.sender, tokenId, username, traitsHash);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory uri = _tokenURIs[tokenId];
        if (bytes(uri).length > 0) return uri;
        return bytes(_baseTokenURI).length > 0
            ? string.concat(_baseTokenURI, usernameByTokenId[tokenId])
            : "";
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function setAuthorizedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidAuthorizedSigner();
        authorizedSigner = newSigner;
        emit AuthorizedSignerUpdated(newSigner);
    }
}
