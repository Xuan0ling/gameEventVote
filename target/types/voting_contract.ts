export type VotingContract = {
  "version": "0.1.0",
  "name": "voting_contract",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startNewRound",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool0",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool1",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool2",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "votingPeriod",
          "type": "i64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimPoolFunds",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool2",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "programState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "votingPeriod",
            "type": "i64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "isActiveRound",
            "type": "bool"
          },
          {
            "name": "roundNumber",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteRecord"
              }
            }
          },
          {
            "name": "totalFunds",
            "type": "u64"
          },
          {
            "name": "roundNumber",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "RoundStarted",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "startTime",
          "type": "i64",
          "index": false
        },
        {
          "name": "votingPeriod",
          "type": "i64",
          "index": false
        },
        {
          "name": "pool0",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool1",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool2",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "RoundCompleted",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "winningPool",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalFunds",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RefundProcessed",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "poolId",
          "type": "u8",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "gasFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RefundSkipped",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "poolId",
          "type": "u8",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPoolId",
      "msg": "Invalid pool ID"
    },
    {
      "code": 6001,
      "name": "VotingEnded",
      "msg": "Voting period has ended"
    },
    {
      "code": 6002,
      "name": "VotingNotEnded",
      "msg": "Voting period has not ended"
    },
    {
      "code": 6003,
      "name": "UnauthorizedWithdrawal",
      "msg": "Unauthorized withdrawal attempt"
    },
    {
      "code": 6004,
      "name": "AlreadyVoted",
      "msg": "User has already voted"
    },
    {
      "code": 6005,
      "name": "NoActiveRound",
      "msg": "No active voting round"
    },
    {
      "code": 6006,
      "name": "RoundAlreadyActive",
      "msg": "Round already active"
    },
    {
      "code": 6007,
      "name": "InvalidRound",
      "msg": "Invalid round"
    },
    {
      "code": 6008,
      "name": "UnauthorizedClaim",
      "msg": "Unauthorized claim attempt"
    },
    {
      "code": 6009,
      "name": "OverflowError",
      "msg": "Overflow occurred during calculation"
    },
    {
      "code": 6010,
      "name": "TransferFailed",
      "msg": "Transfer of funds failed"
    },
    {
      "code": 6011,
      "name": "UserAccountNotFound",
      "msg": "User account not found"
    }
  ]
};

export const IDL: VotingContract = {
  "version": "0.1.0",
  "name": "voting_contract",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startNewRound",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool0",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool1",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool2",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "votingPeriod",
          "type": "i64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimPoolFunds",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool0",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool1",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool2",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "programState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "votingPeriod",
            "type": "i64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "isActiveRound",
            "type": "bool"
          },
          {
            "name": "roundNumber",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteRecord"
              }
            }
          },
          {
            "name": "totalFunds",
            "type": "u64"
          },
          {
            "name": "roundNumber",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "RoundStarted",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "startTime",
          "type": "i64",
          "index": false
        },
        {
          "name": "votingPeriod",
          "type": "i64",
          "index": false
        },
        {
          "name": "pool0",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool1",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pool2",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "RoundCompleted",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "winningPool",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalFunds",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RefundProcessed",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "poolId",
          "type": "u8",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "gasFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RefundSkipped",
      "fields": [
        {
          "name": "roundNumber",
          "type": "u64",
          "index": false
        },
        {
          "name": "poolId",
          "type": "u8",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPoolId",
      "msg": "Invalid pool ID"
    },
    {
      "code": 6001,
      "name": "VotingEnded",
      "msg": "Voting period has ended"
    },
    {
      "code": 6002,
      "name": "VotingNotEnded",
      "msg": "Voting period has not ended"
    },
    {
      "code": 6003,
      "name": "UnauthorizedWithdrawal",
      "msg": "Unauthorized withdrawal attempt"
    },
    {
      "code": 6004,
      "name": "AlreadyVoted",
      "msg": "User has already voted"
    },
    {
      "code": 6005,
      "name": "NoActiveRound",
      "msg": "No active voting round"
    },
    {
      "code": 6006,
      "name": "RoundAlreadyActive",
      "msg": "Round already active"
    },
    {
      "code": 6007,
      "name": "InvalidRound",
      "msg": "Invalid round"
    },
    {
      "code": 6008,
      "name": "UnauthorizedClaim",
      "msg": "Unauthorized claim attempt"
    },
    {
      "code": 6009,
      "name": "OverflowError",
      "msg": "Overflow occurred during calculation"
    },
    {
      "code": 6010,
      "name": "TransferFailed",
      "msg": "Transfer of funds failed"
    },
    {
      "code": 6011,
      "name": "UserAccountNotFound",
      "msg": "User account not found"
    }
  ]
};
