;; Simple Counter Smart Contract
;; Demonstrates basic state changes with increment, decrement, and reset

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-underflow (err u101))

;; Data Variables - Global Counter
(define-data-var counter uint u0)
(define-data-var total-increments uint u0)
(define-data-var total-decrements uint u0)
(define-data-var total-resets uint u0)

;; User Counters - Each user has their own counter
(define-map user-counters
    { user: principal }
    { 
        count: uint,
        last-updated: uint
    }
)

;; Read-only functions

(define-read-only (get-counter)
    (ok (var-get counter))
)

(define-read-only (get-user-counter (user principal))
    (ok (default-to 
        { count: u0, last-updated: u0 }
        (map-get? user-counters { user: user })
    ))
)

(define-read-only (get-stats)
    (ok {
        current-count: (var-get counter),
        total-increments: (var-get total-increments),
        total-decrements: (var-get total-decrements),
        total-resets: (var-get total-resets)
    })
)

;; Public functions - Global Counter

(define-public (increment)
    (let
        (
            (current-count (var-get counter))
            (new-count (+ current-count u1))
        )
        (var-set counter new-count)
        (var-set total-increments (+ (var-get total-increments) u1))
        
        (print {
            event: "incremented",
            old-value: current-count,
            new-value: new-count,
            by: tx-sender,
            timestamp: burn-block-height
        })
        
        (ok new-count)
    )
)

(define-public (decrement)
    (let
        (
            (current-count (var-get counter))
        )
        ;; Prevent underflow (going below zero)
        (asserts! (> current-count u0) err-underflow)
        
        (let
            (
                (new-count (- current-count u1))
            )
            (var-set counter new-count)
            (var-set total-decrements (+ (var-get total-decrements) u1))
            
            (print {
                event: "decremented",
                old-value: current-count,
                new-value: new-count,
                by: tx-sender,
                timestamp: burn-block-height
            })
            
            (ok new-count)
        )
    )
)

(define-public (reset)
    (let
        (
            (old-count (var-get counter))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        
        (var-set counter u0)
        (var-set total-resets (+ (var-get total-resets) u1))
        
        (print {
            event: "reset",
            old-value: old-count,
            new-value: u0,
            by: tx-sender,
            timestamp: burn-block-height
        })
        
        (ok u0)
    )
)

(define-public (add-amount (amount uint))
    (let
        (
            (current-count (var-get counter))
            (new-count (+ current-count amount))
        )
        (var-set counter new-count)
        
        (print {
            event: "amount-added",
            amount: amount,
            old-value: current-count,
            new-value: new-count,
            by: tx-sender
        })
        
        (ok new-count)
    )
)

(define-public (subtract-amount (amount uint))
    (let
        (
            (current-count (var-get counter))
        )
        ;; Ensure we don't go below zero
        (asserts! (>= current-count amount) err-underflow)
        
        (let
            (
                (new-count (- current-count amount))
            )
            (var-set counter new-count)
            
            (print {
                event: "amount-subtracted",
                amount: amount,
                old-value: current-count,
                new-value: new-count,
                by: tx-sender
            })
            
            (ok new-count)
        )
    )
)

;; Public functions - User Counter

(define-public (increment-my-counter)
    (let
        (
            (user-data (default-to 
                { count: u0, last-updated: u0 }
                (map-get? user-counters { user: tx-sender })))
            (current-count (get count user-data))
            (new-count (+ current-count u1))
        )
        (map-set user-counters
            { user: tx-sender }
            {
                count: new-count,
                last-updated: burn-block-height
            }
        )
        
        (print {
            event: "user-counter-incremented",
            user: tx-sender,
            old-value: current-count,
            new-value: new-count
        })
        
        (ok new-count)
    )
)

(define-public (decrement-my-counter)
    (let
        (
            (user-data (default-to 
                { count: u0, last-updated: u0 }
                (map-get? user-counters { user: tx-sender })))
            (current-count (get count user-data))
        )
        (asserts! (> current-count u0) err-underflow)
        
        (let
            (
                (new-count (- current-count u1))
            )
            (map-set user-counters
                { user: tx-sender }
                {
                    count: new-count,
                    last-updated: burn-block-height
                }
            )
            
            (print {
                event: "user-counter-decremented",
                user: tx-sender,
                old-value: current-count,
                new-value: new-count
            })
            
            (ok new-count)
        )
    )
)

(define-public (reset-my-counter)
    (let
        (
            (user-data (default-to 
                { count: u0, last-updated: u0 }
                (map-get? user-counters { user: tx-sender })))
            (old-count (get count user-data))
        )
        (map-set user-counters
            { user: tx-sender }
            {
                count: u0,
                last-updated: burn-block-height
            }
        )
        
        (print {
            event: "user-counter-reset",
            user: tx-sender,
            old-value: old-count,
            new-value: u0
        })
        
        (ok u0)
    )
)
