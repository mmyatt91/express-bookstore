// Integration tests for books routes
process.env.NODE_ENV = "test"

const request = require("supertest")
const app = require("../app")
const db = require("../db")

let test_book;

beforeEach(async function () {
    const result = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('DM062865', 'https://amazon.com/kingdomconmen',
        'Myatt', 'English', 400, "ChiBorn Publishing",
        'Dad's First Published', 2021)
        RETURNING isbn`)
    test_book = result.rows[0].isbn
})

describe("GET /books", async function () {
    test("Get list of all books", async function () {
        const resp = await request(app).get(`/books`)
        const books = resp.body.books
        expect(books).toHaveLength(1)
        expect(books[0]).toHaveProperty("amazon_url");
    })
})

describe("GET /books/:isbn", async function () {
    test("Get one book using the isbn", async function () {
        const resp = await request(app).get(`/books/${test_book}`)
        expect(resp.body.book).toHaveProperty("isbn");
        expect(resp.body.book.isbn).toBe(test_book)
    })
    test("Return 404 if book is unfound", async function () {
        const resp = await request(app).get(`/books/24`)
        expect(resp.statusCode).toBe(404)
    })
});

describe("POST /books", async function () {
    test("Create new book", async function () {
        const resp = await request(app)
            .post(`/books`)
            .send({
                isbn: "123456789",
                amazon_url: "http://amazon.com/makeitbetter",
                author: "Green Back" ,
                language: "Spanish",
                pages: 150,
                publisher: "Capital Publishers",
                title: "See The Money, Be The Money",
                year: 1965
            });
        expect(resp.body.book).toHaveProperty("language");
        expect(resp.statusCode).toBe(201);
    })
    test("Error for if isbn is not provided", async function () {
        const resp = await request(app)
            .post(`/books`)
            .send({title: "Money Being Made"})
        expect(resp.statusCode).toBe(404)
    });
});

describe("PUT /books/:id", async function () {
    test("Update an existing book", async function () {
        const resp = await request(app)
            .put(`/books/${test_book}`)
            .send({
                isbn,
                amazon_url: "http://amazon.com/newmanyes",
                author: "Mee Yay",
                language: "Swahilli",
                pages: 200,
                publisher: "Nunya Bizness",
                title: "He's Coming",
                year: 2019
            })
        expect(resp.body.book).toHaveProperty("author");
        expect(resp.body.book.year).toBe(2019);
    })
    test("Return 404 if book is unfound", async function () {
        const resp = await request(app)
            .put(`/books/24`)
        expect(resp.statusCode).toBe(404)
    })
})

describe("DELETE /books/:id", async function () {
    test("Delete test book", async function () {
        const resp = await request(app)
            .delete(`/books/${test_book}`)
        expect(resp.body).toEqual({message: "Book has been deleted!"})
    })
})

afterEach( async function () {
    await db.query("DELETE FROM BOOKS");
})

afterAll( async function () {
    await db.end()
});


