;; Simple Storage Smart Contract
;; Store and retrieve data on the blockchain

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))

;; Data Variables
(define-data-var stored-number uint u0)
(define-data-var stored-text (string-ascii 100) "")
(define-data-var owner-message (string-utf8 200) u"Welcome to Simple Storage!")

;; Data Maps
(define-map user-data
    { user: principal }
    { 
        number: uint,
        text: (string-ascii 100),
        timestamp: uint
    }
)

(define-map simple-records
    { record-id: uint }
    {
        owner: principal,
        data: (string-utf8 500),
        created-at: uint
    }
)

(define-data-var record-counter uint u0)

;; Read-only functions

(define-read-only (get-stored-number)
    (ok (var-get stored-number))
)

(define-read-only (get-stored-text)
    (ok (var-get stored-text))
)

(define-read-only (get-owner-message)
    (ok (var-get owner-message))
)

(define-read-only (get-user-data (user principal))
    (ok (map-get? user-data { user: user }))
)

(define-read-only (get-record (record-id uint))
    (ok (map-get? simple-records { record-id: record-id }))
)

(define-read-only (get-record-count)
    (ok (var-get record-counter))
)

;; Public functions

(define-public (store-number (number uint))
    (begin
        (var-set stored-number number)
        (print { event: "number-stored", value: number, by: tx-sender })
        (ok number)
    )
)

(define-public (store-text (text (string-ascii 100)))
    (begin
        (var-set stored-text text)
        (print { event: "text-stored", value: text, by: tx-sender })
        (ok text)
    )
)

(define-public (store-user-data (number uint) (text (string-ascii 100)))
    (begin
        (map-set user-data
            { user: tx-sender }
            {
                number: number,
                text: text,
                timestamp: burn-block-height
            }
        )
        (print { 
            event: "user-data-stored",
            user: tx-sender,
            number: number,
            text: text
        })
        (ok true)
    )
)

(define-public (create-record (data (string-utf8 500)))
    (let
        (
            (new-record-id (+ (var-get record-counter) u1))
        )
        (map-set simple-records
            { record-id: new-record-id }
            {
                owner: tx-sender,
                data: data,
                created-at: burn-block-height
            }
        )
        (var-set record-counter new-record-id)
        
        (print {
            event: "record-created",
            record-id: new-record-id,
            owner: tx-sender
        })
        
        (ok new-record-id)
    )
)

(define-public (delete-user-data)
    (begin
        (map-delete user-data { user: tx-sender })
        (print { event: "user-data-deleted", user: tx-sender })
        (ok true)
    )
)

;; Owner-only functions

(define-public (set-owner-message (message (string-utf8 200)))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set owner-message message)
        (ok message)
    )
)
