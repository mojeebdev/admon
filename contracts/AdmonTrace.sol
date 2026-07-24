// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AdmonTrace
 * @notice Weekly, wallet-bound public GitHub build records for Admon.
 * @dev The signer authorizes a record only after the app confirms GitHub OAuth
 * ownership of the exact username. Metadata is resolved through a controlled
 * base URI so Admon can move its metadata domain without replacing the NFT.
 */
contract AdmonTrace is ERC721, EIP712, Ownable2Step {
    using ECDSA for bytes32;

    bytes32 private constant MINT_TYPEHASH = keccak256(
        "Mint(address recipient,string username,string weekKey,bytes32 traitsHash,uint256 deadline)"
    );

    uint256 private _nextTokenId;
    address public authorizedSigner;
    string private _baseTokenURI;
    bool public mintingPaused;

    mapping(bytes32 => uint256) public tokenIdByRecordKey;
    mapping(uint256 => string) public usernameByTokenId;
    mapping(uint256 => string) public weekKeyByTokenId;
    mapping(uint256 => bytes32) public traitsHashOf;

    event BuildRecordMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string username,
        string weekKey,
        bytes32 traitsHash
    );
    event AuthorizedSignerUpdated(address indexed signer);
    event BaseURIUpdated(string baseURI);
    event MintingPauseUpdated(bool paused);
    // ERC-4906 event. Indexers use it to refresh metadata after a domain move.
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    error RecordAlreadyMinted(string username, string weekKey);
    error EmptyUsername();
    error EmptyWeekKey();
    error EmptyTraitsHash();
    error EmptyBaseURI();
    error AuthorizationExpired();
    error InvalidMintAuthorization();
    error InvalidAuthorizedSigner();
    error MintingIsPaused();

    constructor(string memory initialBaseURI, address initialAuthorizedSigner)
        ERC721("Admon Trace", "TRACE")
        EIP712("Admon Trace", "1")
        Ownable(msg.sender)
    {
        if (bytes(initialBaseURI).length == 0) revert EmptyBaseURI();
        if (initialAuthorizedSigner == address(0)) revert InvalidAuthorizedSigner();
        _baseTokenURI = initialBaseURI;
        authorizedSigner = initialAuthorizedSigner;
    }

    function recordKey(string calldata username, string calldata weekKey) public pure returns (bytes32) {
        return keccak256(abi.encode(username, weekKey));
    }

    function mint(
        string calldata username,
        string calldata weekKey,
        bytes32 traitsHash,
        uint256 deadline,
        bytes calldata authorization
    ) external returns (uint256) {
        if (mintingPaused) revert MintingIsPaused();
        if (bytes(username).length == 0) revert EmptyUsername();
        if (bytes(weekKey).length == 0) revert EmptyWeekKey();
        if (traitsHash == bytes32(0)) revert EmptyTraitsHash();
        if (block.timestamp > deadline) revert AuthorizationExpired();

        bytes32 key = recordKey(username, weekKey);
        if (tokenIdByRecordKey[key] != 0) revert RecordAlreadyMinted(username, weekKey);

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                msg.sender,
                keccak256(bytes(username)),
                keccak256(bytes(weekKey)),
                traitsHash,
                deadline
            )
        );
        if (_hashTypedDataV4(structHash).recover(authorization) != authorizedSigner) {
            revert InvalidMintAuthorization();
        }

        uint256 tokenId = ++_nextTokenId;
        tokenIdByRecordKey[key] = tokenId;
        usernameByTokenId[tokenId] = username;
        weekKeyByTokenId[tokenId] = weekKey;
        traitsHashOf[tokenId] = traitsHash;

        _safeMint(msg.sender, tokenId);
        emit BuildRecordMinted(msg.sender, tokenId, username, weekKey, traitsHash);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(_baseTokenURI, usernameByTokenId[tokenId], "/", weekKeyByTokenId[tokenId]);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        if (bytes(newBaseURI).length == 0) revert EmptyBaseURI();
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
        emit BatchMetadataUpdate(1, _nextTokenId);
    }

    function setAuthorizedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidAuthorizedSigner();
        authorizedSigner = newSigner;
        emit AuthorizedSignerUpdated(newSigner);
    }

    function setMintingPaused(bool paused) external onlyOwner {
        mintingPaused = paused;
        emit MintingPauseUpdated(paused);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0x49064906 || super.supportsInterface(interfaceId);
    }
}
