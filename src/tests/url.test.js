const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

describe("URL Shortening API", () => {
  let authToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Mock User Login
    const authResponse = await request(app).post("/api/auth/google").send({ token: "mock_google_token" });
    authToken = authResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("Create a short URL", async () => {
    const response = await request(app)
      .post("/api/url/shorten")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ longUrl: "https://example.com" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("shortUrl");
  });

  test("Get original URL from alias", async () => {
    const createResponse = await request(app)
      .post("/api/url/shorten")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ longUrl: "https://example.com" });

    const { alias } = createResponse.body;
    const response = await request(app).get(`/api/url/${alias}`);

    expect(response.status).toBe(302); // Redirects
  });

  test("Handle invalid URL", async () => {
    const response = await request(app).get("/api/url/invalidAlias");
    expect(response.status).toBe(404);
  });
});
