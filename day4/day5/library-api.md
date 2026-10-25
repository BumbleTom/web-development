# Library API Design

## Resource

Books

---

## 1. List All Books

- Method: GET
- Path: /books
- Description: Returns all books.
- Success Code: 200 OK

---

## 2. Get One Book

- Method: GET
- Path: /books/{id}
- Description: Returns a single book by ID.
- Success Code: 200 OK

Example:

GET /books/12

---

## 3. Create Book

- Method: POST
- Path: /books
- Description: Creates a new book.
- Success Code: 201 Created

Example Request Body:

```json
{
  "title": "JavaScript Basics",
  "author": "Jane Smith",
  "year": 2025
}
```

---

## 4. Update Book

- Method: PUT
- Path: /books/{id}
- Description: Updates a book.
- Success Code: 200 OK

Example Request Body:

```json
{
  "title": "Advanced JavaScript",
  "author": "Jane Smith",
  "year": 2026
}
```

---

## 5. Delete Book

- Method: DELETE
- Path: /books/{id}
- Description: Deletes a book.
- Success Code: 204 No Content

Example:

DELETE /books/12

---

## 6. List Books by Author

- Method: GET
- Path: /books?author=Jane%20Smith
- Description: Returns books written by a specific author.
- Success Code: 200 OK

Example:

GET /books?author=Jane%20Smith

---

# Error Codes

## 400 Bad Request

Example:

The request body is missing the title field when creating a book.

---

## 404 Not Found

Example:

A request is made for a book ID that does not exist.

Example:

GET /books/9999