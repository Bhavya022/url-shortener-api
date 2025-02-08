const request = require("supertest");
const app = require("../app"); // Import Express App
const mongoose = require("mongoose");

describe("Auth API", () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    // Disconnect after tests
    await mongoose.connection.close();
  });

  test("Google OAuth login", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({ token: "mock_google_token" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email");
  });

  test("Logout user", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Logged out successfully");
  });
});
