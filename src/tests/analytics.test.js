const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

describe("Analytics API", () => {
  let authToken, alias;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Mock User Login
    const authResponse = await request(app).post("/api/auth/google").send({ token: "mock_google_token" });
    authToken = authResponse.body.token;

    // Create a short URL for testing
    const createResponse = await request(app)
      .post("/api/url/shorten")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ longUrl: "https://example.com" });

    alias = createResponse.body.alias;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("Get URL analytics", async () => {
    const response = await request(app)
      .get(`/api/analytics/${alias}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalClicks");
  });

  test("Get topic-based analytics", async () => {
    const response = await request(app)
      .get(`/api/analytics/topic/general`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalClicks");
  });

  test("Get overall analytics", async () => {
    const response = await request(app)
      .get("/api/analytics/overall")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalUrls");
  });
});
