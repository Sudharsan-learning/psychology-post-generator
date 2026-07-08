const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const db = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn']
});

async function test() {
  try {
    const userId = "user_test_123";
    console.log("Looking up user...");
    let localUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      console.log("Creating user...");
      localUser = await db.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@clerk-user.local`,
        },
      });
    }
    console.log("User:", localUser);

    console.log("Creating post...");
    const post = await db.post.create({
      data: {
        userId: localUser.id,
        topic: "Test Topic",
        caption: "Test Caption",
        hashtags: "#test",
        slides: [
          { eyebrow: "Test", headline: "Test", subtext: "Test" }
        ],
        activeTemplate: "clinical",
        platform: "instagram",
      },
    });
    console.log("Post created successfully:", post);

    // Clean up
    console.log("Cleaning up...");
    await db.post.delete({ where: { id: post.id } });
    await db.user.delete({ where: { id: localUser.id } });
    console.log("Done!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await db.$disconnect();
  }
}

test();