# TicketHub - Design Document

## 1. Requirements

### Functional Requirements

- Browse and search events.
- View event details.
- View available seats for an event.
- Hold seats for 10 minutes while completing payment.
- Purchase tickets.
- View purchased tickets.
- Receive ticket confirmation after successful payment.

### Non-Functional Requirements

- A seat must NEVER be sold twice.
- The system must survive large ticket-sale events with approximately 3,300 requests per second.
- Event pages should load in under 1 second during normal traffic.
- The system should be highly available and scalable.
- Fairness is important: users who arrive first should have the first opportunity to purchase tickets.
- Sensitive customer and payment data must be secure.

---

## 2. Estimates

### Normal Traffic

- 50,000 visitors per day
- Each visitor views 10 pages

Total page views:

500,000 page views/day

Using:

1 day ≈ 100,000 seconds

Requests per second:

500,000 ÷ 100,000

≈ 5 requests/second

### Ticket Sales

- 5,000 tickets sold per day

Purchases per second:

5,000 ÷ 100,000

≈ 0.05 purchases/second

---

### Big Sale Event

- 200,000 users attempting to buy tickets
- 20,000 seats available
- First 10 minutes = 600 seconds
- Assume each user generates about 10 requests while browsing, selecting seats, refreshing, and paying

Total requests:

200,000 × 10

= 2,000,000 requests

Requests per second:

2,000,000 ÷ 600

≈ 3,300 requests/second

### Comparison

Normal traffic:

- ≈ 5 requests/second

Big sale:

- ≈ 3,300 requests/second

This represents approximately 660 times the normal traffic and is the primary design challenge.

Because only 20,000 seats exist:

- Maximum successful purchases = 20,000
- Approximately 180,000 users will not receive tickets

The system must communicate this quickly and fairly.

---

## 3. API Design

### Browse Events

```http
GET /events?search=&city=
```

Returns a list of events matching search criteria.

Success:

```http
200 OK
```

---

### Event Details

```http
GET /events/{id}
```

Returns details for a specific event.

Success:

```http
200 OK
```

---

### View Seats

```http
GET /events/{id}/seats
```

Returns all seats and their current status.

Success:

```http
200 OK
```

---

### Hold Seats

```http
POST /holds
```

Request:

```json
{
  "eventId": 7,
  "seatIds": [101, 102]
}
```

Response:

```json
{
  "holdId": 55,
  "expiresAt": "2026-10-01T10:15:00Z"
}
```

Success:

```http
201 Created
```

Failure:

```http
409 Conflict
```

if one or more seats have already been reserved.

---

### Purchase Tickets

```http
POST /orders
```

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

### View My Tickets

```http
GET /me/tickets
```

Returns all tickets owned by the current user.

Success:

```http
200 OK
```

---

## 4. Data Model

### users

```text
id
name
email
password_hash
```

Constraints:

```text
email UNIQUE
```

---

### events

```text
id
name
venue
starts_at
```

---

### seats

```text
id
event_id
section
row
number
status
hold_id
hold_expires_at
```

Status:

```text
available
held
sold
```

Constraint:

```text
UNIQUE(event_id, section, row, number)
```

---

### orders

```text
id
user_id
event_id
total
status
created_at
```

---

### order_seats

```text
order_id
seat_id
```

Constraint:

```text
UNIQUE(seat_id)
```

---

## Relationships

### Events → Seats

One event contains many seats.

Relationship:

```text
One-to-Many
```

---

### Users → Orders

One user can create many orders.

Relationship:

```text
One-to-Many
```

---

### Orders → Seats

One order can contain many seats.

Each seat may belong to only one completed order.

The database enforces this through:

```text
UNIQUE(seat_id)
```

---

## 5. Preventing Double Booking

Preventing double booking is the most important requirement.

When a customer selects seats, the system creates a temporary hold.

Example:

```sql
BEGIN TRANSACTION;

UPDATE seats
SET status = 'held',
    hold_id = 55,
    hold_expires_at = NOW() + INTERVAL '10 minutes'
WHERE id IN (101,102)
  AND event_id = 7
  AND (
       status = 'available'
       OR
       (
         status = 'held'
         AND hold_expires_at < NOW()
       )
      );

COMMIT;
```

If fewer rows are updated than expected:

```text
ROLLBACK
```

and return:

```http
409 Conflict
```

### Why It Works

The database performs the status check and update in one atomic transaction.

If two customers try to reserve the same seat:

- The first transaction succeeds.
- The second transaction sees the seat is already held.
- The second transaction fails.

As an additional safety layer:

```text
UNIQUE(seat_id)
```

in the order_seats table prevents duplicate ownership.

Expired holds automatically become available again when their hold period expires.

---

## 6. Architecture

```text
                 Browser / Mobile App
                           |
                           v

                         CDN
                           |
                           v

                    Load Balancer
                           |
                           v

                 Virtual Waiting Room
                           |
               Allows ~2,000 buyers
                into the system at
                     a time
                           |
        ------------------------------------------------
        |                      |                       |
        v                      v                       v

   App Server 1          App Server 2          App Server 3

        |                      |                       |
        -------------------------------
                      |
                      v

              Cache (Redis)
              Event pages
              Seat maps
              Short TTL

                      |
                      v

                 Primary DB
            Seats, Orders, Holds

                      |
                      v

                Read Replicas
             Browsing and Search

                      |
                      v

                    Queue

                      |
                      v

                   Workers
         Ticket emails and PDF tickets
```

---

## Component Explanations

### CDN

Serves event pages, images, JavaScript, and CSS quickly from locations close to users.

### Load Balancer

Distributes requests across multiple application servers.

### Waiting Room

Creates a fair queue during high-demand sales and prevents overload.

### App Servers

Handle business rules, holds, purchases, and ticket management.

### Cache (Redis)

Stores frequently requested event and seat information.

### Primary Database

Stores all seat holds, purchases, and orders. This is the source of truth.

### Read Replicas

Handle browsing and search requests so the primary database focuses on purchasing.

### Queue

Stores background jobs that should not slow down checkout.

### Workers

Generate tickets and send email confirmations asynchronously.

---

## Handling the Big Sale

The architecture survives large ticket sales through:

- A virtual waiting room.
- Multiple application servers.
- Auto-scaling infrastructure.
- Caching of event and seat maps.
- Read replicas for browsing activity.
- Database transactions for seat allocation.
- Background processing through queues and workers.

Only the primary database may confirm seat purchases.

This guarantees correctness.

---

## 7. Trade-Offs

### Trade-Off 1: Correctness vs Availability

All seat purchases go through the primary database.

Benefit:

- Prevents double booking.

Cost:

- Some users may need to wait during periods of heavy demand.

---

### Trade-Off 2: Freshness vs Speed

Seat maps are cached for a short period.

Benefit:

- Significantly faster page loads.
- Reduced database load.

Cost:

- A seat that appears available may have just been reserved.

The final purchase validation always occurs in the primary database.

---

### Trade-Off 3: Fairness vs Simplicity

The virtual waiting room introduces additional complexity.

Benefit:

- Fair distribution of purchase opportunities.
- Protection against traffic spikes and bots.

Cost:

- More infrastructure and operational complexity.

---

## Summary

TicketHub is designed to support everyday traffic while also surviving extremely large ticket-sale events. The system focuses on correctness first by using transactions, seat holds, and unique constraints to prevent double booking. Caching, read replicas, load balancing, and a virtual waiting room help the platform scale during high-demand sales while maintaining fairness and reliability.