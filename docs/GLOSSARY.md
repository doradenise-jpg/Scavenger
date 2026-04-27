# Scavngr Glossary and Terminology Guide

## Overview
This glossary defines all technical and domain-specific terms used in the Scavngr project. Terms are organized alphabetically with cross-references to related documentation.

---

## A

**Admin**
The contract administrator with elevated privileges to initialize the contract, manage system settings, and perform administrative operations. See: [Admin Functions](./PARTICIPANT_QUICK_REFERENCE.md#admin-operations)

**Acceptance Criteria**
Specific conditions that must be met for a feature or task to be considered complete.

---

## B

**Budget**
The maximum amount of tokens allocated to an incentive. Once exhausted, the incentive cannot distribute further rewards. See: [Incentive Management](./INCENTIVE_QUICK_REFERENCE.md)

**Batch Operations**
Processing multiple items (waste, materials, transfers) in a single transaction to improve efficiency.

---

## C

**Charity Contract**
A designated smart contract address that receives donations from the recycling platform. Set by the admin. See: [Charity Management](./PARTICIPANT_QUICK_REFERENCE.md#charity-operations)

**Collector**
A participant role responsible for collecting materials from recyclers and transferring them to manufacturers. See: [Participant Roles](./PARTICIPANT_QUICK_REFERENCE.md#roles)

**Confirmation**
The process of verifying waste details by a designated confirmer (not the owner). See: [Waste Confirmation Flow](./WASTE_STORAGE_QUICK_REFERENCE.md#confirmation)

**Contract**
A Soroban smart contract deployed on the Stellar blockchain that manages the recycling platform logic.

---

## D

**Deactivation**
The process of marking a waste item or incentive as inactive, preventing further operations on it. See: [Waste Deactivation](./WASTE_STORAGE_QUICK_REFERENCE.md#deactivation)

**Deregistration**
Removing a participant from the platform, preventing them from submitting or transferring waste. See: [Participant Management](./PARTICIPANT_QUICK_REFERENCE.md#deregistration)

**Domain-Specific Terms**
Terminology specific to the recycling and waste management industry.

---

## E

**E2E Testing**
End-to-End testing that validates complete user workflows from start to finish. See: [E2E Testing Suite](./E2E_TESTING.md)

**Event**
A blockchain event emitted by the contract to log important state changes. Examples: `WasteRegistered`, `WasteTransferred`, `IncentiveCreated`. See: [Events](./src/events.rs)

---

## F

**Fixture**
Pre-configured test data used in automated tests to ensure consistent test conditions.

---

## G

**Gas**
The computational cost of executing operations on the Stellar blockchain. Measured in stroops.

**Global Metrics**
System-wide statistics tracking total waste processed and tokens distributed. See: [Metrics](./WASTE_STORAGE_QUICK_REFERENCE.md#metrics)

---

## H

**Handoff**
The transfer of waste from one participant to another in the supply chain.

---

## I

**Incentive**
A reward mechanism created by manufacturers to encourage waste collection and processing. Includes reward points and budget. See: [Incentive Management](./INCENTIVE_QUICK_REFERENCE.md)

**Incentive Tier**
Different levels of incentives based on waste type or quantity (future feature).

---

## L

**Latitude/Longitude**
Geographic coordinates used to track the location of waste and participants. Range: -90 to 90 for latitude, -180 to 180 for longitude.

---

## M

**Manufacturer**
A participant role that creates incentives to source recycled materials. See: [Participant Roles](./PARTICIPANT_QUICK_REFERENCE.md#roles)

**Material**
Synonym for waste. Represents recyclable items tracked through the supply chain.

**Migration**
The process of upgrading the contract to a new version while preserving data. See: [Migration Guide](./MIGRATION_GUIDE.md)

---

## O

**Ownership**
The participant who currently holds a waste item. Ownership transfers when waste is transferred between participants.

---

## P

**Page Object Pattern**
A testing design pattern that encapsulates UI elements and interactions into reusable objects for cleaner test code.

**Participant**
An entity (individual or organization) registered on the platform with a specific role. See: [Participant Roles](./PARTICIPANT_QUICK_REFERENCE.md#roles)

**Participant Role**
One of three roles: Recycler, Collector, or Manufacturer. Determines what operations a participant can perform.

**Percentage Distribution**
The split of rewards between the collector and platform owner. Configured by admin. See: [Reward Distribution](./INCENTIVE_QUICK_REFERENCE.md#reward-distribution)

---

## R

**Recycler**
A participant role responsible for collecting and processing recyclable materials. See: [Participant Roles](./PARTICIPANT_QUICK_REFERENCE.md#roles)

**Registration**
The process of adding a new participant to the platform with a specific role and location. See: [Participant Registration](./PARTICIPANT_QUICK_REFERENCE.md#registration)

**Reward Points**
The incentive amount offered per unit of waste. Calculated based on waste type and incentive configuration.

**Rollback**
Reverting to a previous version of the contract in case of issues. See: [Migration Guide](./MIGRATION_GUIDE.md#rollback)

---

## S

**Soroban**
Stellar's smart contract platform. Scavngr contracts are written in Rust and compiled to WebAssembly for Soroban.

**Statistics**
Participant-level metrics tracking waste submitted, verified, and transferred. See: [Participant Stats](./PARTICIPANT_QUICK_REFERENCE.md#statistics)

**Storage**
On-chain data storage using Soroban's persistent storage mechanisms. See: [Storage Implementation](./PARTICIPANTS_STORAGE_IMPLEMENTATION.md)

**Supply Chain**
The complete path of waste from recycler → collector → manufacturer.

---

## T

**Technical Terms**
Terminology specific to blockchain, smart contracts, and software development.

**Token Address**
The Stellar asset address used for reward token distribution. Set by admin. See: [Token Management](./PARTICIPANT_QUICK_REFERENCE.md#token-operations)

**Transfer**
Moving waste from one participant to another with location and optional notes. See: [Waste Transfer](./WASTE_STORAGE_QUICK_REFERENCE.md#transfer)

**Transfer History**
Complete audit trail of all transfers for a waste item, including participants, locations, and timestamps.

---

## V

**Verification**
The process of confirming waste authenticity and details by a designated verifier. See: [Material Verification](./WASTE_STORAGE_QUICK_REFERENCE.md#verification)

**Version Compatibility Matrix**
A table showing which versions are compatible with each other and migration paths. See: [Migration Guide](./MIGRATION_GUIDE.md#compatibility)

---

## W

**Waste**
Recyclable material tracked through the supply chain. Identified by unique ID, type, weight, and location.

**Waste Type**
Category of recyclable material: Paper, Plastic, Metal, Glass, or Organic.

**WASM**
WebAssembly. The binary format used to deploy Soroban smart contracts.

---

## X

**XLM**
Stellar's native cryptocurrency used for transaction fees and operations on the Stellar network.

---

## Acronyms and Abbreviations

| Acronym | Full Form | Definition |
|---------|-----------|-----------|
| E2E | End-to-End | Testing methodology covering complete workflows |
| RPC | Remote Procedure Call | Protocol for calling contract functions |
| WASM | WebAssembly | Binary format for smart contracts |
| XLM | Stellar Lumens | Stellar's native cryptocurrency |
| CLI | Command Line Interface | Terminal-based tool for contract deployment |
| API | Application Programming Interface | Interface for contract interaction |
| DAO | Decentralized Autonomous Organization | Governance structure (future feature) |
| NFT | Non-Fungible Token | Unique digital asset (future feature) |
| KYC | Know Your Customer | Identity verification (future feature) |
| AML | Anti-Money Laundering | Compliance check (future feature) |

---

## Cross-References

### By Topic

**Participant Management**
- [Participant Quick Reference](./PARTICIPANT_QUICK_REFERENCE.md)
- [Participant Implementation](./PARTICIPANT_IMPLEMENTATION.md)
- [Participant Serialization](./PARTICIPANT_SERIALIZATION.md)

**Waste Management**
- [Waste Storage Quick Reference](./WASTE_STORAGE_QUICK_REFERENCE.md)
- [Waste Storage Implementation](./WASTE_STORAGE_IMPLEMENTATION.md)
- [Transfer Record Implementation](./TRANSFER_RECORD_IMPLEMENTATION.md)

**Incentive Management**
- [Incentive Quick Reference](./INCENTIVE_QUICK_REFERENCE.md)
- [Incentive Implementation](./INCENTIVE_IMPLEMENTATION.md)

**Testing & Quality**
- [E2E Testing Suite](./E2E_TESTING.md)
- [Test Coverage Report](./TEST_COVERAGE_REPORT.md)

**Deployment & Operations**
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Kubernetes Deployment](./KUBERNETES_DEPLOYMENT.md)
- [CI/CD Pipeline](./CI_CD_PIPELINE.md)

---

## Related Documentation

- [Contract API](./CONTRACT_API.md) - Complete API reference
- [README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines

---

## Notes

- This glossary is maintained alongside the codebase and updated with each release
- For pronunciation guides or translations, refer to the project's localization resources
- Terms are linked to relevant implementation files and documentation
- Acronyms follow industry standards where applicable
