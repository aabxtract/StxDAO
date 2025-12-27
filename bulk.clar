;; Clarity Bulk Transfer Smart Contract
;; Transfer STX to multiple recipients in a single transaction

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u500))
(define-constant err-invalid-amount (err u501))
(define-constant err-invalid-recipient (err u502))
(define-constant err-insufficient-balance (err u503))
(define-constant err-transfer-failed (err u504))
(define-constant err-too-many-recipients (err u505))
(define-constant err-array-mismatch (err u506))
(define-constant err-contract-paused (err u507))

;; Maximum recipients per transaction
(define-constant max-recipients u200)

;; Data Variables
(define-data-var transfer-counter uint u0)
(define-data-var total-transfers uint u0)
(define-data-var total-volume uint u0)
(define-data-var contract-paused bool false)
(define-data-var fee-enabled bool false)
(define-data-var fee-amount uint u0)
(define-data-var total-fees-collected uint u0)

;; Transfer history
(define-map bulk-transfers
    { transfer-id: uint }
    {
        sender: principal,
        recipient-count: uint,
        total-amount: uint,
        timestamp: uint,
        transfer-type: (string-ascii 20)
    }
)

;; Individual transfer records
(define-map transfer-details
    { transfer-id: uint, index: uint }
    {
        recipient: principal,
        amount: uint,
        success: bool
    }
)

;; User statistics
(define-map user-stats
    { user: principal }
    {
        total-sent: uint,
        total-received: uint,
        transfer-count: uint
    }
)

;; Read-only functions

(define-read-only (get-bulk-transfer (transfer-id uint))
    (map-get? bulk-transfers { transfer-id: transfer-id })
)

(define-read-only (get-transfer-detail (transfer-id uint) (index uint))
    (map-get? transfer-details { transfer-id: transfer-id, index: index })
)

(define-read-only (get-user-stats (user principal))
    (default-to
        { total-sent: u0, total-received: u0, transfer-count: u0 }
        (map-get? user-stats { user: user })
    )
)

(define-read-only (get-contract-stats)
    (ok {
        total-transfers: (var-get total-transfers),
        total-volume: (var-get total-volume),
        transfer-counter: (var-get transfer-counter),
        is-paused: (var-get contract-paused),
        fee-enabled: (var-get fee-enabled),
        fee-amount: (var-get fee-amount),
        total-fees-collected: (var-get total-fees-collected)
    })
)

(define-read-only (calculate-total-amount (amounts (list 200 uint)))
    (ok (fold + amounts u0))
)

(define-read-only (get-fee-amount)
    (ok (var-get fee-amount))
)

(define-read-only (is-paused)
    (ok (var-get contract-paused))
)

;; Private helper functions

(define-private (update-sender-stats (sender principal) (amount uint))
    (let
        (
            (current-stats (get-user-stats sender))
        )
        (map-set user-stats
            { user: sender }
            {
                total-sent: (+ (get total-sent current-stats) amount),
                total-received: (get total-received current-stats),
                transfer-count: (+ (get transfer-count current-stats) u1)
            }
        )
    )
)

(define-private (update-receiver-stats (receiver principal) (amount uint))
    (let
        (
            (current-stats (get-user-stats receiver))
        )
        (map-set user-stats
            { user: receiver }
            {
                total-sent: (get total-sent current-stats),
                total-received: (+ (get total-received current-stats) amount),
                transfer-count: (get transfer-count current-stats)
            }
        )
    )
)

;; Fold helper for summing amounts
(define-private (sum-amounts (amount uint) (total uint))
    (+ total amount)
)

;; Fold helper for processing single transfer
(define-private (process-single-transfer
    (recipient principal)
    (state { index: uint, transfer-id: uint, amount: uint, failed: uint }))
    (let
        (
            (transfer-result (stx-transfer? (get amount state) tx-sender recipient))
        )
        ;; Record transfer detail
        (map-set transfer-details
            { transfer-id: (get transfer-id state), index: (get index state) }
            {
                recipient: recipient,
                amount: (get amount state),
                success: (is-ok transfer-result)
            }
        )
        
        ;; Update receiver stats if successful
        (if (is-ok transfer-result)
            (update-receiver-stats recipient (get amount state))
            false
        )
        
        {
            index: (+ (get index state) u1),
            transfer-id: (get transfer-id state),
            amount: (get amount state),
            failed: (if (is-err transfer-result) 
                (+ (get failed state) u1) 
                (get failed state))
        }
    )
)

;; Fold helper for processing variable amount transfers
(define-private (process-variable-transfer
    (item { recipient: principal, amount: uint })
    (state { index: uint, transfer-id: uint, total-sent: uint, failed: uint }))
    (let
        (
            (transfer-result (stx-transfer? (get amount item) tx-sender (get recipient item)))
        )
        ;; Record transfer detail
        (map-set transfer-details
            { transfer-id: (get transfer-id state), index: (get index state) }
            {
                recipient: (get recipient item),
                amount: (get amount item),
                success: (is-ok transfer-result)
            }
        )
        
        ;; Update receiver stats if successful
        (if (is-ok transfer-result)
            (update-receiver-stats (get recipient item) (get amount item))
            false
        )
        
        {
            index: (+ (get index state) u1),
            transfer-id: (get transfer-id state),
            total-sent: (+ (get total-sent state) (get amount item)),
            failed: (if (is-err transfer-result) 
                (+ (get failed state) u1) 
                (get failed state))
        }
    )
)

;; Helper to combine recipients and amounts
(define-private (combine-recipient-amount
    (recipient principal)
    (state { amounts: (list 200 uint), index: uint, result: (list 200 { recipient: principal, amount: uint }) }))
    (let
        (
            (amount (default-to u0 (element-at (get amounts state) (get index state))))
        )
        {
            amounts: (get amounts state),
            index: (+ (get index state) u1),
            result: (unwrap-panic (as-max-len? 
                (append (get result state) { recipient: recipient, amount: amount })
                u200))
        }
    )
)

;; Admin functions

(define-public (set-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set fee-amount new-fee)
        (ok true)
    )
)

(define-public (enable-fee)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set fee-enabled true)
        (ok true)
    )
)

(define-public (disable-fee)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set fee-enabled false)
        (ok true)
    )
)

(define-public (pause-contract)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set contract-paused true)
        (print { event: "contract-paused", timestamp: burn-block-height })
        (ok true)
    )
)

(define-public (unpause-contract)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set contract-paused false)
        (print { event: "contract-unpaused", timestamp: burn-block-height })
        (ok true)
    )
)

(define-public (withdraw-fees (recipient principal))
    (let
        (
            (total-fees (var-get total-fees-collected))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> total-fees u0) err-invalid-amount)
        
        (try! (as-contract (stx-transfer? total-fees tx-sender recipient)))
        (var-set total-fees-collected u0)
        
        (print {
            event: "fees-withdrawn",
            recipient: recipient,
            amount: total-fees,
            timestamp: burn-block-height
        })
        
        (ok total-fees)
    )
)

;; Public bulk transfer functions

(define-public (bulk-transfer-stx 
    (recipients (list 200 principal))
    (amounts (list 200 uint)))
    (let
        (
            (recipient-count (len recipients))
            (amount-count (len amounts))
            (total-amount (fold sum-amounts amounts u0))
            (fee (if (var-get fee-enabled) (var-get fee-amount) u0))
            (new-transfer-id (+ (var-get transfer-counter) u1))
        )
        ;; Validations
        (asserts! (not (var-get contract-paused)) err-contract-paused)
        (asserts! (is-eq recipient-count amount-count) err-array-mismatch)
        (asserts! (> recipient-count u0) err-invalid-recipient)
        (asserts! (<= recipient-count max-recipients) err-too-many-recipients)
        (asserts! (> total-amount u0) err-invalid-amount)
        
        ;; Collect fee if enabled
        (if (var-get fee-enabled)
            (begin
                (try! (stx-transfer? fee tx-sender (as-contract tx-sender)))
                (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
            )
            true
        )
        
        ;; Combine recipients and amounts into transfer items
        (let
            (
                (combined (fold combine-recipient-amount
                    recipients
                    { amounts: amounts, index: u0, result: (list) }))
                (transfers (get result combined))
                (result (fold process-variable-transfer
                    transfers
                    { index: u0, transfer-id: new-transfer-id, total-sent: u0, failed: u0 }))
            )
            ;; Record bulk transfer
            (map-set bulk-transfers
                { transfer-id: new-transfer-id }
                {
                    sender: tx-sender,
                    recipient-count: recipient-count,
                    total-amount: total-amount,
                    timestamp: burn-block-height,
                    transfer-type: "STX"
                }
            )
            
            ;; Update counters
            (var-set transfer-counter new-transfer-id)
            (var-set total-transfers (+ (var-get total-transfers) recipient-count))
            (var-set total-volume (+ (var-get total-volume) total-amount))
            
            ;; Update sender stats
            (update-sender-stats tx-sender total-amount)
            
            ;; Print event
            (print {
                event: "bulk-transfer-completed",
                transfer-id: new-transfer-id,
                sender: tx-sender,
                recipients: recipient-count,
                total-amount: total-amount,
                fee: fee,
                failed: (get failed result),
                timestamp: burn-block-height
            })
            
            (ok new-transfer-id)
        )
    )
)

(define-public (bulk-transfer-equal 
    (recipients (list 200 principal))
    (amount-per-recipient uint))
    (let
        (
            (recipient-count (len recipients))
            (total-amount (* amount-per-recipient recipient-count))
            (fee (if (var-get fee-enabled) (var-get fee-amount) u0))
            (new-transfer-id (+ (var-get transfer-counter) u1))
        )
        ;; Validations
        (asserts! (not (var-get contract-paused)) err-contract-paused)
        (asserts! (> recipient-count u0) err-invalid-recipient)
        (asserts! (<= recipient-count max-recipients) err-too-many-recipients)
        (asserts! (> amount-per-recipient u0) err-invalid-amount)
        
        ;; Collect fee if enabled
        (if (var-get fee-enabled)
            (begin
                (try! (stx-transfer? fee tx-sender (as-contract tx-sender)))
                (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
            )
            true
        )
        
        ;; Execute transfers
        (let
            (
                (result (fold process-single-transfer
                    recipients
                    { index: u0, transfer-id: new-transfer-id, amount: amount-per-recipient, failed: u0 }))
            )
            ;; Record bulk transfer
            (map-set bulk-transfers
                { transfer-id: new-transfer-id }
                {
                    sender: tx-sender,
                    recipient-count: recipient-count,
                    total-amount: total-amount,
                    timestamp: burn-block-height,
                    transfer-type: "STX-EQUAL"
                }
            )
            
            ;; Update counters
            (var-set transfer-counter new-transfer-id)
            (var-set total-transfers (+ (var-get total-transfers) recipient-count))
            (var-set total-volume (+ (var-get total-volume) total-amount))
            
            ;; Update sender stats
            (update-sender-stats tx-sender total-amount)
            
            ;; Print event
            (print {
                event: "bulk-transfer-equal-completed",
                transfer-id: new-transfer-id,
                sender: tx-sender,
                recipients: recipient-count,
                amount-per-recipient: amount-per-recipient,
                total-amount: total-amount,
                fee: fee,
                failed: (get failed result),
                timestamp: burn-block-height
            })
            
            (ok new-transfer-id)
        )
    )
)

(define-public (airdrop
    (recipients (list 200 principal))
    (amount-per-recipient uint)
    (memo (optional (string-utf8 100))))
    (let
        (
            (recipient-count (len recipients))
            (total-amount (* amount-per-recipient recipient-count))
            (new-transfer-id (+ (var-get transfer-counter) u1))
        )
        ;; Validations
        (asserts! (not (var-get contract-paused)) err-contract-paused)
        (asserts! (> recipient-count u0) err-invalid-recipient)
        (asserts! (<= recipient-count max-recipients) err-too-many-recipients)
        (asserts! (> amount-per-recipient u0) err-invalid-amount)
        
        ;; Execute transfers
        (let
            (
                (result (fold process-single-transfer
                    recipients
                    { index: u0, transfer-id: new-transfer-id, amount: amount-per-recipient, failed: u0 }))
            )
            ;; Record bulk transfer
            (map-set bulk-transfers
                { transfer-id: new-transfer-id }
                {
                    sender: tx-sender,
                    recipient-count: recipient-count,
                    total-amount: total-amount,
                    timestamp: burn-block-height,
                    transfer-type: "AIRDROP"
                }
            )
            
            ;; Update counters
            (var-set transfer-counter new-transfer-id)
            (var-set total-transfers (+ (var-get total-transfers) recipient-count))
            (var-set total-volume (+ (var-get total-volume) total-amount))
            
            ;; Update sender stats
            (update-sender-stats tx-sender total-amount)
            
            ;; Print event
            (print {
                event: "airdrop-completed",
                transfer-id: new-transfer-id,
                sender: tx-sender,
                recipients: recipient-count,
                amount-per-recipient: amount-per-recipient,
                total-amount: total-amount,
                memo: memo,
                failed: (get failed result),
                timestamp: burn-block-height
            })
            
            (ok new-transfer-id)
        )
    )
)
