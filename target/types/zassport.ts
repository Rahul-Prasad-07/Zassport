/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/zassport.json`.
 */
export type Zassport = {
  "address": "FR6XtcALdJfPRTLzSyhjt5fJ1eoYsEn8kq4vcGAkd8WQ",
  "metadata": {
    "name": "zassport",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addGuardian",
      "docs": [
        "Add a guardian"
      ],
      "discriminator": [
        167,
        189,
        170,
        27,
        74,
        240,
        201,
        241
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newGuardian",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addVerifier",
      "docs": [
        "Add a verifier to the multi-verifier set"
      ],
      "discriminator": [
        165,
        72,
        135,
        225,
        67,
        181,
        255,
        135
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "multiVerifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newVerifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "approveRecovery",
      "docs": [
        "Guardian approves recovery"
      ],
      "discriminator": [
        148,
        96,
        41,
        38,
        108,
        189,
        129,
        214
      ],
      "accounts": [
        {
          "name": "guardian",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "guardianApproval",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  117,
                  97,
                  114,
                  100,
                  105,
                  97,
                  110,
                  95,
                  97,
                  112,
                  112,
                  114,
                  111,
                  118,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "socialRecoveryConfig"
              },
              {
                "kind": "account",
                "path": "guardian"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "attestAge",
      "discriminator": [
        207,
        61,
        241,
        209,
        103,
        1,
        168,
        89
      ],
      "accounts": [
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "verifierConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minAge",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "attestNationality",
      "discriminator": [
        49,
        118,
        174,
        229,
        111,
        151,
        230,
        39
      ],
      "accounts": [
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "verifierConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "allowedNationality",
          "type": "u64"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "cancelRecovery",
      "docs": [
        "Cancel pending recovery"
      ],
      "discriminator": [
        176,
        23,
        203,
        37,
        121,
        251,
        227,
        83
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "castVote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "voterIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              },
              {
                "kind": "account",
                "path": "voterIdentity"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "vote",
          "type": {
            "defined": {
              "name": "voteType"
            }
          }
        }
      ]
    },
    {
      "name": "createProposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "creatorIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u64"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "votingPeriod",
          "type": "i64"
        }
      ]
    },
    {
      "name": "executeRecovery",
      "docs": [
        "Execute recovery after delay"
      ],
      "discriminator": [
        203,
        133,
        133,
        228,
        153,
        121,
        182,
        237
      ],
      "accounts": [
        {
          "name": "executor",
          "signer": true
        },
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initializeMultiVerifier",
      "docs": [
        "Initialize multi-verifier configuration with threshold"
      ],
      "discriminator": [
        181,
        97,
        40,
        152,
        37,
        80,
        143,
        121
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "multiVerifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u8"
        },
        {
          "name": "verifiers",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    },
    {
      "name": "initializeProgram",
      "discriminator": [
        176,
        107,
        205,
        168,
        24,
        157,
        175,
        103
      ],
      "accounts": [
        {
          "name": "nullifierRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeQuorumStatus",
      "docs": [
        "Initialize quorum status for an identity"
      ],
      "discriminator": [
        201,
        245,
        166,
        112,
        78,
        30,
        237,
        173
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "quorumStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  114,
                  117,
                  109,
                  95,
                  115,
                  116,
                  97,
                  116,
                  117,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeRevocationRegistry",
      "docs": [
        "Initialize revocation registry"
      ],
      "discriminator": [
        0,
        116,
        75,
        127,
        135,
        103,
        20,
        40
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "revocationRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeSocialRecovery",
      "docs": [
        "Initialize social recovery with guardians"
      ],
      "discriminator": [
        253,
        41,
        114,
        176,
        98,
        171,
        195,
        52
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u8"
        },
        {
          "name": "guardians",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "recoveryDelay",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeVerifierConfig",
      "discriminator": [
        25,
        128,
        200,
        77,
        123,
        145,
        42,
        199
      ],
      "accounts": [
        {
          "name": "verifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "verifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initiateRecovery",
      "docs": [
        "Initiate recovery process"
      ],
      "discriminator": [
        132,
        148,
        60,
        74,
        49,
        178,
        235,
        187
      ],
      "accounts": [
        {
          "name": "initiator",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerIdentity",
      "discriminator": [
        164,
        118,
        227,
        177,
        47,
        176,
        187,
        248
      ],
      "accounts": [
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "nullifierRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "reputationRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nullifier",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "removeGuardian",
      "docs": [
        "Remove a guardian"
      ],
      "discriminator": [
        72,
        117,
        160,
        244,
        155,
        185,
        71,
        18
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "socialRecoveryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  99,
                  105,
                  97,
                  108,
                  95,
                  114,
                  101,
                  99,
                  111,
                  118,
                  101,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "guardianToRemove",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeVerifier",
      "docs": [
        "Remove a verifier from the multi-verifier set"
      ],
      "discriminator": [
        179,
        9,
        132,
        183,
        233,
        23,
        172,
        111
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "multiVerifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "verifierToRemove",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "revokeCredential",
      "docs": [
        "Revoke a credential (admin)"
      ],
      "discriminator": [
        38,
        123,
        95,
        95,
        223,
        158,
        169,
        87
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "revocationRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "revocationEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "u8"
        },
        {
          "name": "newMerkleRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "merkleProof",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "selfRevoke",
      "docs": [
        "Self-revoke (user revokes own credential)"
      ],
      "discriminator": [
        92,
        166,
        19,
        51,
        32,
        91,
        29,
        231
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "revocationEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "u8"
        }
      ]
    },
    {
      "name": "submitAttestation",
      "docs": [
        "Submit attestation as a verifier (contributes to quorum)"
      ],
      "discriminator": [
        238,
        220,
        255,
        105,
        183,
        211,
        40,
        83
      ],
      "accounts": [
        {
          "name": "verifier",
          "writable": true,
          "signer": true
        },
        {
          "name": "multiVerifierConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "identity.owner",
                "account": "identity"
              }
            ]
          }
        },
        {
          "name": "verifierAttestation",
          "writable": true
        },
        {
          "name": "quorumStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  111,
                  114,
                  117,
                  109,
                  95,
                  115,
                  116,
                  97,
                  116,
                  117,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "attestationType",
          "type": "u8"
        },
        {
          "name": "attestedValue",
          "type": "u64"
        },
        {
          "name": "expiry",
          "type": "i64"
        },
        {
          "name": "signature",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "updateMerkleRoot",
      "docs": [
        "Update Merkle root for batch revocations"
      ],
      "discriminator": [
        195,
        173,
        38,
        60,
        242,
        203,
        158,
        93
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "revocationRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  111,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateReputation",
      "discriminator": [
        194,
        220,
        43,
        201,
        54,
        209,
        49,
        178
      ],
      "accounts": [
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "reputationRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "identity"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "points",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateThreshold",
      "docs": [
        "Update quorum threshold"
      ],
      "discriminator": [
        251,
        36,
        24,
        179,
        157,
        31,
        239,
        234
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "multiVerifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  95,
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newThreshold",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateVerifier",
      "discriminator": [
        198,
        42,
        44,
        241,
        47,
        104,
        225,
        255
      ],
      "accounts": [
        {
          "name": "verifierConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "verifierConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newVerifier",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "verifyAgeProof",
      "discriminator": [
        37,
        55,
        231,
        243,
        143,
        174,
        155,
        93
      ],
      "accounts": [
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nullifier",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "currentTimestamp",
          "type": "i64"
        },
        {
          "name": "minAge",
          "type": "u64"
        },
        {
          "name": "maxAge",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "verifyNationalityProof",
      "discriminator": [
        140,
        204,
        172,
        55,
        158,
        201,
        70,
        17
      ],
      "accounts": [
        {
          "name": "identity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nullifier",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "allowedNationality",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "verifyPassportProof",
      "discriminator": [
        117,
        138,
        69,
        250,
        170,
        118,
        83,
        154
      ],
      "accounts": [
        {
          "name": "identity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "nullifierRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  117,
                  108,
                  108,
                  105,
                  102,
                  105,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nullifier",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "proof",
          "type": "bytes"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "governanceProposal",
      "discriminator": [
        53,
        107,
        240,
        190,
        43,
        73,
        65,
        143
      ]
    },
    {
      "name": "guardianApproval",
      "discriminator": [
        29,
        45,
        179,
        215,
        164,
        218,
        160,
        29
      ]
    },
    {
      "name": "identity",
      "discriminator": [
        58,
        132,
        5,
        12,
        176,
        164,
        85,
        112
      ]
    },
    {
      "name": "multiVerifierConfig",
      "discriminator": [
        160,
        110,
        134,
        62,
        98,
        212,
        134,
        224
      ]
    },
    {
      "name": "nullifierRegistry",
      "discriminator": [
        100,
        229,
        171,
        224,
        85,
        171,
        147,
        206
      ]
    },
    {
      "name": "quorumStatus",
      "discriminator": [
        230,
        131,
        210,
        81,
        70,
        121,
        139,
        222
      ]
    },
    {
      "name": "reputationRecord",
      "discriminator": [
        140,
        29,
        118,
        100,
        134,
        207,
        99,
        194
      ]
    },
    {
      "name": "revocationEntry",
      "discriminator": [
        64,
        238,
        133,
        108,
        230,
        6,
        181,
        154
      ]
    },
    {
      "name": "revocationRegistry",
      "discriminator": [
        54,
        80,
        0,
        128,
        217,
        204,
        30,
        106
      ]
    },
    {
      "name": "socialRecoveryConfig",
      "discriminator": [
        140,
        24,
        254,
        91,
        165,
        23,
        49,
        104
      ]
    },
    {
      "name": "verifierAttestation",
      "discriminator": [
        175,
        210,
        8,
        73,
        206,
        135,
        215,
        198
      ]
    },
    {
      "name": "verifierConfig",
      "discriminator": [
        176,
        103,
        248,
        36,
        138,
        167,
        176,
        220
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nullifierAlreadyUsed",
      "msg": "Nullifier has already been used - identity already registered"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6002,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access to identity"
    },
    {
      "code": 6003,
      "name": "identityNotActive",
      "msg": "Identity is not active"
    },
    {
      "code": 6004,
      "name": "titleTooLong",
      "msg": "Proposal title is too long (max 200 characters)"
    },
    {
      "code": 6005,
      "name": "descriptionTooLong",
      "msg": "Proposal description is too long (max 1000 characters)"
    },
    {
      "code": 6006,
      "name": "invalidVotingPeriod",
      "msg": "Invalid voting period"
    },
    {
      "code": 6007,
      "name": "proposalAlreadyExecuted",
      "msg": "Proposal has already been executed"
    },
    {
      "code": 6008,
      "name": "votingPeriodEnded",
      "msg": "Voting period has ended"
    },
    {
      "code": 6009,
      "name": "invalidZkProof",
      "msg": "Invalid ZK proof"
    },
    {
      "code": 6010,
      "name": "invalidProof",
      "msg": "Invalid proof data"
    },
    {
      "code": 6011,
      "name": "invalidCommitment",
      "msg": "Invalid commitment"
    },
    {
      "code": 6012,
      "name": "invalidNullifier",
      "msg": "Invalid nullifier"
    },
    {
      "code": 6013,
      "name": "passportVerificationFailed",
      "msg": "Passport verification failed"
    },
    {
      "code": 6014,
      "name": "invalidVerificationKey",
      "msg": "Invalid verification key"
    },
    {
      "code": 6015,
      "name": "proofVerificationFailed",
      "msg": "Proof verification failed"
    },
    {
      "code": 6016,
      "name": "invalidSignatureCount",
      "msg": "Invalid signature count"
    },
    {
      "code": 6017,
      "name": "insufficientSignatures",
      "msg": "Insufficient signatures for quorum"
    },
    {
      "code": 6018,
      "name": "insufficientValidSignatures",
      "msg": "Insufficient valid signatures"
    },
    {
      "code": 6019,
      "name": "invalidGuardianCount",
      "msg": "Invalid guardian count"
    },
    {
      "code": 6020,
      "name": "invalidThreshold",
      "msg": "Invalid threshold value"
    },
    {
      "code": 6021,
      "name": "insufficientGuardianSignatures",
      "msg": "Insufficient guardian signatures"
    },
    {
      "code": 6022,
      "name": "missingEd25519Instruction",
      "msg": "Missing ed25519 signature instruction"
    },
    {
      "code": 6023,
      "name": "invalidAttestationMessage",
      "msg": "Invalid attestation message"
    },
    {
      "code": 6024,
      "name": "invalidVerifier",
      "msg": "Invalid verifier public key"
    },
    {
      "code": 6025,
      "name": "attestationTimestampInvalid",
      "msg": "Attestation expired or not yet valid"
    }
  ],
  "types": [
    {
      "name": "governanceProposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "votingEnds",
            "type": "i64"
          },
          {
            "name": "yesVotes",
            "type": "u64"
          },
          {
            "name": "noVotes",
            "type": "u64"
          },
          {
            "name": "executed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "guardianApproval",
      "docs": [
        "Guardian Approval",
        "Individual guardian approvals for recovery"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recoveryConfig",
            "type": "pubkey"
          },
          {
            "name": "guardian",
            "type": "pubkey"
          },
          {
            "name": "newOwner",
            "type": "pubkey"
          },
          {
            "name": "approvedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "identity",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nullifier",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reputationScore",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "ageVerified",
            "type": "bool"
          },
          {
            "name": "nationalityVerified",
            "type": "bool"
          },
          {
            "name": "lastAttestationTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "multiVerifierConfig",
      "docs": [
        "Multi-Verifier Quorum Configuration",
        "Manages a set of trusted verifiers for decentralized attestation"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "totalVerifiers",
            "type": "u8"
          },
          {
            "name": "verifiers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "nullifierRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nullifiers",
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "quorumStatus",
      "docs": [
        "Quorum Status for an Identity",
        "Tracks which attestations have reached quorum"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identity",
            "type": "pubkey"
          },
          {
            "name": "ageAttestationCount",
            "type": "u8"
          },
          {
            "name": "ageThresholdMet",
            "type": "bool"
          },
          {
            "name": "ageValue",
            "type": "u64"
          },
          {
            "name": "nationalityAttestationCount",
            "type": "u8"
          },
          {
            "name": "nationalityThresholdMet",
            "type": "bool"
          },
          {
            "name": "nationalityValue",
            "type": "u64"
          },
          {
            "name": "validityAttestationCount",
            "type": "u8"
          },
          {
            "name": "validityThresholdMet",
            "type": "bool"
          },
          {
            "name": "validityExpiry",
            "type": "i64"
          },
          {
            "name": "sanctionsAttestationCount",
            "type": "u8"
          },
          {
            "name": "sanctionsThresholdMet",
            "type": "bool"
          },
          {
            "name": "sanctionsClear",
            "type": "bool"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reputationRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identity",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u64"
          },
          {
            "name": "contributions",
            "type": "u64"
          },
          {
            "name": "lastContribution",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "revocationEntry",
      "docs": [
        "Revocation Entry",
        "Used for credential revocation"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identity",
            "type": "pubkey"
          },
          {
            "name": "revokedBy",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "u8"
          },
          {
            "name": "revokedAt",
            "type": "i64"
          },
          {
            "name": "merkleProof",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "revocationRegistry",
      "docs": [
        "Revocation Registry",
        "On-chain Merkle root for efficient revocation checks"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "totalRevocations",
            "type": "u64"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "socialRecoveryConfig",
      "docs": [
        "Social Recovery Configuration",
        "Manages guardians for identity recovery"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identity",
            "type": "pubkey"
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "totalGuardians",
            "type": "u8"
          },
          {
            "name": "guardians",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "recoveryDelay",
            "type": "i64"
          },
          {
            "name": "pendingRecovery",
            "type": "bool"
          },
          {
            "name": "pendingNewOwner",
            "type": "pubkey"
          },
          {
            "name": "recoveryInitiatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "verifierAttestation",
      "docs": [
        "Individual Attestation from a Verifier",
        "Each verifier submits their attestation separately"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identity",
            "type": "pubkey"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "attestationType",
            "type": "u8"
          },
          {
            "name": "attestedValue",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "signature",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "verifierConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "u64"
          },
          {
            "name": "voterIdentity",
            "type": "pubkey"
          },
          {
            "name": "vote",
            "type": "u8"
          },
          {
            "name": "votedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "voteType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "yes"
          },
          {
            "name": "no"
          }
        ]
      }
    }
  ]
};
