# SnapShare Scaling Plan

## Assumptions

Starting facts:

- 10 million registered users
- 10% active each day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- Average photo size = 2 MB
- Thumbnail size = 50 KB

### Daily Active Users

10,000,000 × 10%

= 1,000,000 daily active users

---

## Traffic Estimates

### Uploads Per Day

1,000,000 active users × 1 upload

= 1,000,000 uploads per day

### Uploads Per Second

1,000,000 ÷ 86,400

≈ 11.57 uploads per second

≈ 12 uploads per second

---

### Feed Views Per Day

1,000,000 active users × 50 views

= 50,000,000 feed views per day

### Average Feed Views Per Second

50,000,000 ÷ 86,400

≈ 578.7

≈ 579 feed views per second

### Peak Feed Views Per Second

579 × 5

≈ 2,895 feed views per second

---

## Storage Estimate

### Storage Per Photo

Photo:

2 MB

Thumbnail:

50 KB = 0.05 MB

Total:

2.05 MB

### Storage Per Day

1,000,000 uploads × 2.05 MB

= 2,050,000 MB

= 2,050 GB

≈ 2.05 TB per day

### Storage Per Year

2.05 TB × 365

≈ 748.25 TB per year

---

## Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system.

Reason:

Users upload only one photo per day, but they view 50 feed pages per day. Feed requests are therefore far more common than upload requests.

Implication:

The architecture should prioritize fast reads through caching, read replicas, and a CDN.

---

## Why Photos Should Not Be Stored in the Database

Photos are large binary files.

Storing them directly in a database would make the database very large, expensive, and slower to back up and query.

Instead:

- Store photo files in object storage.
- Store only photo metadata and file references in the database.

Examples:

- Amazon S3
- Azure Blob Storage
- Google Cloud Storage

---

# Architecture Diagram

```text
                     +----------------+
                     |     Users      |
                     +--------+-------+
                              |
                              v

                     +----------------+
                     |      CDN       |
                     +--------+-------+
                              |
                              v

                    +------------------+
                    |  Load Balancer   |
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v

 +-------------+    +-------------+    +-------------+
 | App Server  |    | App Server  |    | App Server  |
 +------+------+    +------+------+    +------ +-----+
        |                   |                   |
        +-------------------+-------------------+
                            |
                            v

                   +----------------+
                   |     Cache      |
                   |    (Redis)     |
                   +-------+--------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v

 +----------------+               +----------------+
 |  Main Database |-------------->| Read Replica   |
 +----------------+               +----------------+

          |
          |
          v

 +----------------+
 | Object Storage |
 |    Photos      |
 +--------+-------+
          |
          v

 +----------------+
 |     Queue      |
 +--------+-------+
          |
          v

 +----------------+
 | Thumbnail      |
 | Worker         |
 +----------------+
```

---

# Component Explanations

### CDN

Delivers images from servers closer to users and reduces load on the application.

### Load Balancer

Distributes requests across multiple application servers.

### App Servers

Handle application logic such as uploads, logins, and feed generation.

### Cache (Redis)

Stores frequently requested feed data to reduce database load.

### Main Database

Stores user accounts, relationships, photo metadata, and activity records.

### Read Replica

Handles read requests so the main database is not overloaded.

### Object Storage

Stores the actual image files and thumbnails.

### Queue

Allows thumbnail generation to happen asynchronously.

### Thumbnail Worker

Processes jobs from the queue and generates thumbnails.

---

# Photo Upload Flow

1. User uploads a photo using the mobile or web application.
2. Request arrives at the load balancer.
3. The load balancer forwards the request to an application server.
4. The application server stores the original photo in object storage.
5. The application server stores photo metadata in the main database.
6. The application server places a thumbnail-generation job in the queue.
7. A thumbnail worker reads the job from the queue.
8. The worker generates a smaller thumbnail image.
9. The thumbnail is saved into object storage.
10. Feed metadata is updated so users can view both the original image and thumbnail.
11. Future image requests are served through the CDN.

---

# Trade-Offs

## Trade-Off 1: Cache Freshness vs Performance

Using a cache makes feed requests much faster, but users may occasionally see slightly outdated information.

Benefit:

- Faster response times
- Reduced database load

Cost:

- Temporary inconsistency

---

## Trade-Off 2: Read Replicas vs Complexity

Read replicas improve scalability and reduce pressure on the primary database.

Benefit:

- More read capacity
- Better performance

Cost:

- Extra infrastructure
- Replication lag may cause slight delays before new data appears everywhere

---

## Trade-Off 3: Object Storage vs Database Storage

Object storage is cheaper and scales better for large files.

Benefit:

- Lower storage costs
- Easier scaling

Cost:

- Additional service to manage
- More complex architecture

---

# Summary

SnapShare serves approximately 1 million daily active users, processes roughly 12 uploads per second, handles about 579 feed views per second on average and about 2,895 feed views per second during peak traffic. The system stores approximately 748 TB of photo data per year, making object storage, caching, read replicas, and a CDN essential components for scalability.