# SnapShare - Scaling Plan

## Assumptions

- 10,000,000 registered users.
- 10% active daily = 1,000,000 Daily Active Users (DAU).
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Average photo size = 2 MB.
- Thumbnail size = 50 KB.
- 1 day ≈ 100,000 seconds.
- Peak traffic = 5× average traffic.

---

## Estimates

### Daily Active Users

10,000,000 × 10%

= 1,000,000 DAU

### Uploads

1,000,000 uploads per day

1,000,000 ÷ 100,000

≈ 10 uploads per second

Peak:

10 × 5

≈ 50 uploads per second

### Feed Views

1,000,000 users × 50 feed views

= 50,000,000 feed views per day

50,000,000 ÷ 100,000

≈ 500 feed views per second

Peak:

500 × 5

≈ 2,500 feed views per second

### Storage

Each upload stores:

- Photo = 2 MB
- Thumbnail = 50 KB ≈ 0.05 MB

Total per upload:

2.05 MB

Per day:

1,000,000 × 2.05 MB

≈ 2 TB per day

Per year:

2 TB × 365

≈ 750 TB per year

---

## Read-Heavy or Write-Heavy?

SnapShare is a very read-heavy system.

For every upload there are approximately 50 feed views. This means the architecture should focus on making reads efficient through the use of caching, content delivery networks (CDNs), and read replicas, while ensuring uploads remain reliable.

---

## Where Do the Photos Go?

Photos must not be stored directly in the database.

Storing approximately 750 TB of image files every year inside the database would make it extremely large, expensive, and difficult to back up efficiently.

Instead:

- Photo files should be stored in object storage (such as Amazon S3).
- The database should store only metadata such as:
  - photo ID
  - owner ID
  - caption
  - upload time
  - photo URL
  - thumbnail URL

---

## Architecture

```text
                     Mobile App / Browser
                               │
                               │ Photos & Thumbnails
                               ├──────────────────────► CDN
                               │                         │
                               │                         ▼
                               │                  Object Storage
                               │                  (Image Files)
                               │
                               │ API Requests
                               ▼

                      +------------------+
                      |  Load Balancer   |
                      +---------+--------+
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼

 +---------------+      +---------------+      +---------------+
 | App Server 1  |      | App Server 2  |      | App Server 3  |
 +-------+-------+      +-------+-------+      +-------+-------+
         │                      │                      │
         └──────────────┬───────┴──────────────┬───────┘
                        │                      │
                        ▼                      ▼

                  +-----------+        +-------------+
                  |   Cache   |        |    Queue    |
                  |  Redis    |        +------+------+
                  +-----+-----+               |
                        │                     ▼
                        │             +---------------+
                        │             | Thumbnail     |
                        │             | Worker        |
                        │             +-------+-------+
                        │                     |
                        ▼                     |
                +---------------+            |
                | Primary DB    |------------+
                +-------+-------+
                        |
                        |
                        ▼
                +---------------+
                | Read Replica  |
                +---------------+
```

---

## Components

### CDN

Serves photos from servers close to users so images load quickly and application servers handle less traffic.

### Object Storage

Stores hundreds of terabytes of photo files reliably and at lower cost than a database.

### Load Balancer

Distributes requests across multiple application servers and removes unhealthy servers from service.

### App Servers

Handle uploads, authentication, feed generation, and API requests.

### Cache (Redis)

Stores frequently requested feed data in memory so users can scroll quickly.

### Primary Database

Stores user accounts, follows, likes, comments, and photo metadata.

### Read Replica

Handles heavy read traffic and protects the main database from overload.

### Queue

Holds background jobs so time-consuming tasks do not slow down uploads.

### Thumbnail Worker

Processes jobs from the queue and creates smaller thumbnail images.

---

## Upload Flow

1. A user uploads a photo from the mobile app or browser.
2. The request reaches the load balancer.
3. The load balancer forwards the request to an application server.
4. The application server validates the user's authentication token.
5. The application server checks the file type and file size.
6. The original image is saved to object storage.
7. Photo metadata is saved to the primary database.
8. A thumbnail-generation job is added to the queue.
9. The application server immediately returns **201 Created** to the user.
10. A thumbnail worker retrieves the job from the queue.
11. The worker generates a 50 KB thumbnail.
12. The thumbnail is saved in object storage.
13. The database record is updated with the thumbnail URL.
14. Relevant cached feeds are invalidated so followers can see the new photo.
15. Future image requests are served through the CDN.

---

## Trade-Offs

### 1. Speed vs Freshness

Feeds can be served from the cache, making them much faster.

Benefit:

- Faster feed loading
- Reduced database load

Cost:

- Users may not see newly uploaded photos immediately.

---

### 2. Simplicity vs Upload Speed

Thumbnail generation is handled in the background.

Benefit:

- Upload requests complete quickly.

Cost:

- For a short period the photo may not yet have a thumbnail and a placeholder image must be shown.

---

### 3. Cost vs Performance

CDNs, object storage, and caching increase infrastructure costs.

Benefit:

- Better reliability and user experience.
- Ability to scale to millions of users.

Cost:

- Higher monthly operating expenses.

---

## Summary

SnapShare serves approximately 1 million daily active users, processes roughly 10 uploads per second on average (50 at peak), handles around 500 feed views per second on average (2,500 at peak), and stores approximately 750 TB of image data per year. Because the application is highly read-heavy, the architecture relies on CDNs, caching, read replicas, object storage, and asynchronous thumbnail generation to remain fast and scalable.
