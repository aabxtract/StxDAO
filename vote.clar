;; DAO Voting Smart Contract
;; Decentralized Autonomous Organization governance system

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u800))
(define-constant err-not-found (err u801))
(define-constant err-unauthorized (err u802))
(define-constant err-already-voted (err u803))
(define-constant err-proposal-closed (err u804))
(define-constant err-proposal-active (err u805))
(define-constant err-insufficient-tokens (err u806))
(define-constant err-not-member (err u807))
(define-constant err-quorum-not-met (err u808))
(define-constant err-invalid-data (err u809))

;; Proposal status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PASSED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)
(define-constant STATUS-CANCELLED u5)

;; Vote types
(define-constant VOTE-YES u1)
(define-constant VOTE-NO u2)
(define-constant VOTE-ABSTAIN u3)

;; DAO Configuration
(define-constant voting-period u1440)        ;; ~10 days (in blocks)
(define-constant quorum-percentage u20)      ;; 20% of total voting power needed
(define-constant approval-threshold u51)     ;; 51% yes votes needed

;; Data Variables
(define-data-var proposal-counter uint u0)
(define-data-var total-members uint u0)
(define-data-var total-voting-power uint u0)
(define-data-var dao-treasury uint u0)

;; DAO Members
(define-map members
    { member: principal }
    {
        voting-power: uint,
        joined-at: uint,
        is-active: bool,
        proposals-created: uint,
        total-votes-cast: uint
    }
)

;; Proposals
(define-map proposals
    { proposal-id: uint }
    {
        proposer: principal,
        title: (string-utf8 200),
        description: (string-utf8 1000),
        status: uint,
        created-at: uint,
        voting-ends-at: uint,
        executed-at: (optional uint),
        yes-votes: uint,
        no-votes: uint,
        abstain-votes: uint,
        total-votes: uint,
        quorum-reached: bool,
        vote-count: uint
    }
)

;; Vote records
(define-map votes
    { proposal-id: uint, voter: principal }
    {
        vote-type: uint,
        voting-power: uint,
        voted-at: uint,
        comment: (optional (string-utf8 500))
    }
)

;; Member proposal list
(define-map member-proposals
    { member: principal }
    { proposal-ids: (list 100 uint) }
)

;; Member vote list
(define-map member-votes
    { member: principal }
    { proposal-ids: (list 200 uint) }
)

;; Proposal voting records (who voted)
(define-map proposal-voters
    { proposal-id: uint }
    { voters: (list 500 principal) }
)

;; Delegation (members can delegate voting power)
(define-map delegations
    { delegator: principal }
    {
        delegate: principal,
        delegated-at: uint,
        is-active: bool
    }
)

;; Read-only functions

(define-read-only (get-member (member principal))
    (map-get? members { member: member })
)

(define-read-only (is-member (member principal))
    (match (get-member member)
        member-data (get is-active member-data)
        false
    )
)

(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
    (is-some (get-vote proposal-id voter))
)

(define-read-only (get-member-proposals (member principal))
    (default-to
        { proposal-ids: (list) }
        (map-get? member-proposals { member: member })
    )
)

(define-read-only (get-member-votes (member principal))
    (default-to
        { proposal-ids: (list) }
        (map-get? member-votes { member: member })
    )
)

(define-read-only (get-proposal-voters (proposal-id uint))
    (default-to
        { voters: (list) }
        (map-get? proposal-voters { proposal-id: proposal-id })
    )
)

(define-read-only (get-delegation (delegator principal))
    (map-get? delegations { delegator: delegator })
)

(define-read-only (get-dao-stats)
    (ok {
        total-members: (var-get total-members),
        total-voting-power: (var-get total-voting-power),
        total-proposals: (var-get proposal-counter),
        treasury: (var-get dao-treasury)
    })
)

(define-read-only (get-voting-power (member principal))
    (match (get-member member)
        member-data (ok (get voting-power member-data))
        (ok u0)
    )
)

(define-read-only (calculate-quorum (proposal-id uint))
    (match (get-proposal proposal-id)
        proposal
            (let
                (
                    (total-power (var-get total-voting-power))
                    (votes-cast (get total-votes proposal))
                    (required-votes (/ (* total-power quorum-percentage) u100))
                )
                (ok {
                    votes-cast: votes-cast,
                    required-votes: required-votes,
                    quorum-reached: (>= votes-cast required-votes),
                    participation-rate: (if (> total-power u0)
                        (/ (* votes-cast u100) total-power)
                        u0)
                })
            )
        (err err-not-found)
    )
)

(define-read-only (get-proposal-result (proposal-id uint))
    (match (get-proposal proposal-id)
        proposal
            (let
                (
                    (yes (get yes-votes proposal))
                    (no (get no-votes proposal))
                    (total-decisive (+ yes no))
                    (approval-rate (if (> total-decisive u0)
                        (/ (* yes u100) total-decisive)
                        u0))
                )
                (ok {
                    yes-votes: yes,
                    no-votes: no,
                    abstain-votes: (get abstain-votes proposal),
                    approval-rate: approval-rate,
                    will-pass: (and 
                        (get quorum-reached proposal)
                        (>= approval-rate approval-threshold))
                })
            )
        (err err-not-found)
    )
)

;; Private helper functions

(define-private (add-proposal-to-member (member principal) (proposal-id uint))
    (let
        (
            (current-proposals (get proposal-ids (get-member-proposals member)))
        )
        (map-set member-proposals
            { member: member }
            { proposal-ids: (unwrap-panic (as-max-len? (append current-proposals proposal-id) u100)) }
        )
    )
)

(define-private (add-vote-to-member (member principal) (proposal-id uint))
    (let
        (
            (current-votes (get proposal-ids (get-member-votes member)))
        )
        (map-set member-votes
            { member: member }
            { proposal-ids: (unwrap-panic (as-max-len? (append current-votes proposal-id) u200)) }
        )
    )
)

(define-private (add-voter-to-proposal (proposal-id uint) (voter principal))
    (let
        (
            (current-voters (get voters (get-proposal-voters proposal-id)))
        )
        (map-set proposal-voters
            { proposal-id: proposal-id }
            { voters: (unwrap-panic (as-max-len? (append current-voters voter) u500)) }
        )
    )
)

;; Membership functions

(define-public (join-dao (voting-power uint))
    (begin
        (asserts! (> voting-power u0) err-invalid-data)
        (asserts! (is-none (get-member tx-sender)) err-unauthorized)
        
        (map-set members
            { member: tx-sender }
            {
                voting-power: voting-power,
                joined-at: burn-block-height,
                is-active: true,
                proposals-created: u0,
                total-votes-cast: u0
            }
        )
        
        (var-set total-members (+ (var-get total-members) u1))
        (var-set total-voting-power (+ (var-get total-voting-power) voting-power))
        
        (print {
            event: "member-joined",
            member: tx-sender,
            voting-power: voting-power,
            timestamp: burn-block-height
        })
        
        (ok true)
    )
)

(define-public (update-voting-power (member principal) (new-power uint))
    (let
        (
            (member-data (unwrap! (get-member member) err-not-found))
            (old-power (get voting-power member-data))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        
        (map-set members
            { member: member }
            (merge member-data { voting-power: new-power })
        )
        
        (var-set total-voting-power (+ (- (var-get total-voting-power) old-power) new-power))
        
        (ok true)
    )
)

(define-public (delegate-vote (delegate principal))
    (let
        (
            (delegator-data (unwrap! (get-member tx-sender) err-not-member))
        )
        (asserts! (is-member delegate) err-not-member)
        (asserts! (not (is-eq tx-sender delegate)) err-invalid-data)
        
        (map-set delegations
            { delegator: tx-sender }
            {
                delegate: delegate,
                delegated-at: burn-block-height,
                is-active: true
            }
        )
        
        (print {
            event: "vote-delegated",
            delegator: tx-sender,
            delegate: delegate,
            timestamp: burn-block-height
        })
        
        (ok true)
    )
)

(define-public (revoke-delegation)
    (let
        (
            (delegation (unwrap! (get-delegation tx-sender) err-not-found))
        )
        (map-set delegations
            { delegator: tx-sender }
            (merge delegation { is-active: false })
        )
        
        (ok true)
    )
)

;; Proposal functions

(define-public (create-proposal
    (title (string-utf8 200))
    (description (string-utf8 1000)))
    (let
        (
            (member-data (unwrap! (get-member tx-sender) err-not-member))
            (new-proposal-id (+ (var-get proposal-counter) u1))
            (voting-ends (+ burn-block-height voting-period))
        )
        (asserts! (get is-active member-data) err-unauthorized)
        (asserts! (> (len title) u0) err-invalid-data)
        
        (map-set proposals
            { proposal-id: new-proposal-id }
            {
                proposer: tx-sender,
                title: title,
                description: description,
                status: STATUS-ACTIVE,
                created-at: burn-block-height,
                voting-ends-at: voting-ends,
                executed-at: none,
                yes-votes: u0,
                no-votes: u0,
                abstain-votes: u0,
                total-votes: u0,
                quorum-reached: false,
                vote-count: u0
            }
        )
        
        (map-set members
            { member: tx-sender }
            (merge member-data {
                proposals-created: (+ (get proposals-created member-data) u1)
            })
        )
        
        (var-set proposal-counter new-proposal-id)
        (add-proposal-to-member tx-sender new-proposal-id)
        
        (print {
            event: "proposal-created",
            proposal-id: new-proposal-id,
            proposer: tx-sender,
            title: title,
            voting-ends-at: voting-ends,
            timestamp: burn-block-height
        })
        
        (ok new-proposal-id)
    )
)

(define-public (cast-vote
    (proposal-id uint)
    (vote-type uint)
    (comment (optional (string-utf8 500))))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
            (member-data (unwrap! (get-member tx-sender) err-not-member))
            (voter-power (get voting-power member-data))
        )
        ;; Validations
        (asserts! (get is-active member-data) err-unauthorized)
        (asserts! (is-eq (get status proposal) STATUS-ACTIVE) err-proposal-closed)
        (asserts! (<= burn-block-height (get voting-ends-at proposal)) err-proposal-closed)
        (asserts! (not (has-voted proposal-id tx-sender)) err-already-voted)
        (asserts! (or (is-eq vote-type VOTE-YES)
                     (or (is-eq vote-type VOTE-NO)
                         (is-eq vote-type VOTE-ABSTAIN)))
                 err-invalid-data)
        
        ;; Record vote
        (map-set votes
            { proposal-id: proposal-id, voter: tx-sender }
            {
                vote-type: vote-type,
                voting-power: voter-power,
                voted-at: burn-block-height,
                comment: comment
            }
        )
        
        ;; Update proposal vote counts
        (let
            (
                (new-yes (if (is-eq vote-type VOTE-YES)
                    (+ (get yes-votes proposal) voter-power)
                    (get yes-votes proposal)))
                (new-no (if (is-eq vote-type VOTE-NO)
                    (+ (get no-votes proposal) voter-power)
                    (get no-votes proposal)))
                (new-abstain (if (is-eq vote-type VOTE-ABSTAIN)
                    (+ (get abstain-votes proposal) voter-power)
                    (get abstain-votes proposal)))
                (new-total (+ (get total-votes proposal) voter-power))
                (required-quorum (/ (* (var-get total-voting-power) quorum-percentage) u100))
            )
            (map-set proposals
                { proposal-id: proposal-id }
                (merge proposal {
                    yes-votes: new-yes,
                    no-votes: new-no,
                    abstain-votes: new-abstain,
                    total-votes: new-total,
                    vote-count: (+ (get vote-count proposal) u1),
                    quorum-reached: (>= new-total required-quorum)
                })
            )
        )
        
        ;; Update member stats
        (map-set members
            { member: tx-sender }
            (merge member-data {
                total-votes-cast: (+ (get total-votes-cast member-data) u1)
            })
        )
        
        (add-vote-to-member tx-sender proposal-id)
        (add-voter-to-proposal proposal-id tx-sender)
        
        (print {
            event: "vote-cast",
            proposal-id: proposal-id,
            voter: tx-sender,
            vote-type: vote-type,
            voting-power: voter-power,
            timestamp: burn-block-height
        })
        
        (ok true)
    )
)

(define-public (finalize-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
            (result (unwrap-panic (get-proposal-result proposal-id)))
        )
        (asserts! (is-eq (get status proposal) STATUS-ACTIVE) err-proposal-closed)
        (asserts! (> burn-block-height (get voting-ends-at proposal)) err-proposal-active)
        
        (let
            (
                (passed (and 
                    (get quorum-reached proposal)
                    (>= (get approval-rate result) approval-threshold)))
                (new-status (if passed STATUS-PASSED STATUS-REJECTED))
            )
            (map-set proposals
                { proposal-id: proposal-id }
                (merge proposal { status: new-status })
            )
            
            (print {
                event: "proposal-finalized",
                proposal-id: proposal-id,
                status: new-status,
                quorum-reached: (get quorum-reached proposal),
                approval-rate: (get approval-rate result),
                timestamp: burn-block-height
            })
            
            (ok new-status)
        )
    )
)

(define-public (execute-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status proposal) STATUS-PASSED) err-unauthorized)
        
        (map-set proposals
            { proposal-id: proposal-id }
            (merge proposal {
                status: STATUS-EXECUTED,
                executed-at: (some burn-block-height)
            })
        )
        
        (print {
            event: "proposal-executed",
            proposal-id: proposal-id,
            timestamp: burn-block-height
        })
        
        (ok true)
    )
)

(define-public (cancel-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (get-proposal proposal-id) err-not-found))
        )
        (asserts! (or (is-eq tx-sender (get proposer proposal))
                     (is-eq tx-sender contract-owner))
                 err-unauthorized)
        (asserts! (is-eq (get status proposal) STATUS-ACTIVE) err-proposal-closed)
        
        (map-set proposals
            { proposal-id: proposal-id }
            (merge proposal { status: STATUS-CANCELLED })
        )
        
        (ok true)
    )
)
