const { getDB, runDB, allDB } = require("./index");

async function initSampleData(db) {
  await initUser(db);
  await initPost(db);
}

async function initUser(db) {
  let row = await getDB(db, "SELECT COUNT(*) as count FROM users");
  if (row.count > 0) {
    console.log("User count:", row.count);
    return;
  }
  let users = [
    {
      username: "Alice Wong",
      email: "alice.wong@gmail.com",
      password: "alice123",
      avatar:
        "https://sample.hkit.cc/image?keyword=alice+wong+avatar&seed=avatar",
      bio: "Hello, I am Alice. I love coding and coffee.",
      created_at: new Date("2025-05-11 12:13").toISOString(),
    },
    {
      username: "Bob Lee",
      email: "bob.lee@gmail.com",
      password: "bob123",
      avatar: "https://sample.hkit.cc/image?keyword=bob+lee+avatar&seed=avatar",
      bio: "Hi, I am Bob. I enjoy hiking and photography.",
      created_at: new Date("2025-05-12 12:13").toISOString(),
    },
  ];
  for (let user of users) {
    await runDB(
      db,
      `INSERT INTO users (username, email, password, avatar, bio, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.username,
        user.email,
        user.password,
        user.avatar,
        user.bio,
        user.created_at,
      ]
    );
  }
  console.log("User count:", users.length);
}

async function initPost(db) {
  let row = await getDB(db, "SELECT COUNT(*) as count FROM posts");
  if (row.count > 0) {
    console.log("Post count:", row.count);
    return;
  }
  let users = await allDB(db, "SELECT id, username FROM users");
  for (let user of users) {
    await runDB(
      db,
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        user.id,
        `Hello, I am ${user.username}. This is my first post.`,
        `https://sample.hkit.cc/image?keyword=${user.username}+post&seed=post`,]
    );
  }
  console.log("Post count:", users.length);
}

module.exports = {
  initSampleData,
};
