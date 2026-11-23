# TicketHub System Design

## 1. Requirements

### Functional Requirements

The TicketHub system must allow users to:

- Browse events
- Search for events
- View event details
- View available seats
- Hold seats temporarily during checkout
- Purchase tickets
- View purchased tickets
- Receive booking confirmations
- Manage their account

### Non-Functional Requirements

The system should be:

- Fast: pages should load quickly even during ticket sales.
- Highly available: users should be able to access the service at all times.
- Correct: no seat should ever be sold to more than one customer.
- Fair: users should have an equal opportunity to purchase tickets during high-demand events.
- Scalable: the system should handle sudden traffic spikes.
- Secure: user and payment information must be protected.

---

# 2. Traffic Estimates

## Assumptions

- 2,000,000 registered users
- 50,000 visitors on a normal day
- Each visitor views 10 pages
- 5,000 tickets sold on a normal day
- Peak event: 200,000 users compete for 20,000 seats in 10 minutes
- 1 day ≈ 100,000 seconds

---

## Normal Traffic

### Page Views

50,000 visitors × 10 pages

= 500,000 page views per day

Page requests per second:

500,000 ÷ 100,000

≈ 5 requests/second

### Ticket Purchases

5,000 tickets/day

5,000 ÷ 100,000

≈ 0.05 purchases/second

---

## Big Concert Sale

200,000 users attempt purchases in 10 minutes.

10 minutes = 600 seconds

Requests per second:

200,000 ÷ 600

≈ 333 requests/second

### Comparison

Normal traffic:

- 5 page requests/second

Big sale traffic:

- 333 requests/second

The sale generates approximately 66 times more traffic than a normal day.

---

# 3. API Design

## Browse Events

### GET /events

Returns all available events.

Success:

```http
200 OK
```

---

## View Event

### GET /events/{id}

Returns details about a specific event.

Success:

```http
200 OK
```

---

## View Seats

### GET /events/{id}/seats

Returns available, held, and sold seats.

Success:

```http
200 OK
```

---

## Hold Seats

### POST /seat-holds

Temporarily reserves seats during checkout.

Request:

```json
{
  "eventId": 10,
  "seatIds": [101, 102]
}
```

Success:

```http
201 Created
```

---

## Purchase Tickets

### POST /orders

Creates an order and completes payment.

Request:

```json
{
  "holdId": 55,
  "paymentToken": "abc123"
}
```

Success:

```http
201 Created
```

---

## View Purchased Tickets

### GET /orders/{id}

Returns purchased ticket details.

Success:

```http
200 OK
```

---

# 4. Data Model

## Users

| Column | Type |
|----------|----------|
| id | INTEGER |
| name | VARCHAR |
| email | VARCHAR |

---

## Events

| Column | Type |
|----------|----------|
| id | INTEGER |
| title | VARCHAR |
| venue | VARCHAR |
| event_date | DATETIME |

---

## Seats

| Column | Type |
|----------|----------|
| id | INTEGER |
| event_id | INTEGER |
| seat_number | VARCHAR |
| status | VARCHAR |

Status:

- available
- held
- sold

---

## Orders

| Column | Type |
|----------|----------|
| id | INTEGER |
| user_id | INTEGER |
| seat_id | INTEGER |
| purchase_time | DATETIME |

---

## Relationships

### Users → Orders

One-to-many

One user can have many orders.

---

### Events → Seats

One-to-many

One event contains many seats.

---

### Seats → Orders

One-to-one

A seat can only belong to one completed order.

---

# 5. Preventing Double Booking

Preventing double booking is the most important requirement of TicketHub.

The system uses three protections:

## Seat Holds

When a user selects a seat, its status changes from:

```text
available
```

to

```text
held
```

for a limited time (for example, 10 minutes).

Other users cannot purchase held seats.

---

## Database Transactions

Purchasing tickets is performed inside a transaction.

Either:

- Payment succeeds and seat ownership is recorded.

or

- Nothing changes.

This prevents partial purchases.

---

## Unique Constraints

The database enforces uniqueness on seat ownership.

Example:

```sql
UNIQUE(event_id, seat_number)
```

Only one completed order can own a given seat.

---

# 6. Architecture

```text
                      Users
                        |
                        v

                     DNS
                        |
                        v

                     CDN
                        |
                        v

                Load Balancer
                        |
        ---------------------------------
        |               |               |
        v               v               v

   App Server 1   App Server 2   App Server 3
        |               |               |
        ---------------------------------
                        |
                        v

                    Cache
                   (Redis)
                        |
              ------------------
              |                |
              v                v

          Primary DB     Read Replica
              |
              |
              v

            Queue
              |
              v

            Worker
```

---

# Component Explanations

### DNS

Directs users to the TicketHub platform.

### CDN

Caches static files and reduces response times.

### Load Balancer

Distributes requests across multiple application servers.

### App Servers

Handle business logic and ticket sales.

### Cache (Redis)

Stores popular event and seating data.

### Primary Database

Stores users, orders, events, and seats.

### Read Replica

Handles read traffic to reduce load on the primary database.

### Queue

Stores background jobs.

### Worker

Processes jobs such as confirmations and email receipts.

---

# Handling the Big Sale

To survive the 200,000-user rush:

- Multiple application servers process requests.
- Redis caches event and seating information.
- Read replicas handle heavy read traffic.
- Seat holds prevent duplicate purchases.
- Database transactions maintain correctness.
- Optional waiting-room functionality can limit request rates.

---

# Trade-Offs

## Trade-Off 1: Fairness vs Speed

Using a waiting room is fairer during big sales.

Benefit:

- Everyone gets a fair chance.

Cost:

- Users may wait longer.

---

## Trade-Off 2: Consistency vs Availability

Strong seat locking prevents duplicate purchases.

Benefit:

- No double-booked seats.

Cost:

- Slightly slower checkout process.

---

## Trade-Off 3: Cost vs Performance

Additional servers, cache nodes, and replicas improve performance.

Benefit:

- Better user experience.

Cost:

- Increased infrastructure expense.

---

# Summary

TicketHub serves normal daily traffic efficiently while scaling to major concert launches where 200,000 users may compete for 20,000 seats. The combination of caching, load balancing, read replicas, seat holds, transactions, and database constraints ensures both scalability and correctness while preventing double booking.