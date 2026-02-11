/**
 * Urie — Seed script: mock agency, users, creators, and one campaign.
 * Run: npx prisma db seed (or npm run db:seed)
 * Demo login: any seed user with password "demo1234"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "demo1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clean existing seed data (optional: only if you want idempotent re-seed)
  await prisma.postMetrics.deleteMany({});
  await prisma.scheduledPost.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.captionVersion.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.contentTask.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.socialAccount.deleteMany({});
  await prisma.creator.deleteMany({});
  await prisma.agencyMember.deleteMany({});
  await prisma.agency.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Users (password for all: demo1234)
  const ownerUser = await prisma.user.create({
    data: {
      email: "alex@urie.demo",
      passwordHash,
      role: "agency_user",
      profile: { name: "Alex Agency", avatar: null, bio: "Agency owner" },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "jordan@urie.demo",
      passwordHash,
      role: "agency_user",
      profile: { name: "Jordan Manager", avatar: null, bio: "Campaign manager" },
    },
  });

  const creator1User = await prisma.user.create({
    data: {
      email: "sam@urie.demo",
      passwordHash,
      role: "creator",
      profile: { name: "Sam Creator", avatar: null, bio: "IG & TikTok creator" },
    },
  });

  const creator2User = await prisma.user.create({
    data: {
      email: "riley@urie.demo",
      passwordHash,
      role: "creator",
      profile: { name: "Riley Creator", avatar: null, bio: "Content creator" },
    },
  });

  // 2. Agency
  const agency = await prisma.agency.create({
    data: {
      name: "Urie Demo Agency",
      slug: "urie-demo-agency",
      ownerUserId: ownerUser.id,
      settings: { time_zone: "America/Los_Angeles", default_platforms: ["instagram", "tiktok"] },
    },
  });

  // 3. Agency members
  await prisma.agencyMember.create({
    data: { agencyId: agency.id, userId: ownerUser.id, role: "owner" },
  });
  await prisma.agencyMember.create({
    data: { agencyId: agency.id, userId: managerUser.id, role: "manager" },
  });

  // 4. Creators (linked to agency and user)
  const creator1 = await prisma.creator.create({
    data: {
      agencyId: agency.id,
      userId: creator1User.id,
      displayName: "Sam Creator",
      notes: "Main IG & TikTok creator",
      tags: ["beauty", "lifestyle"],
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      agencyId: agency.id,
      userId: creator2User.id,
      displayName: "Riley Creator",
      notes: "Short-form specialist",
      tags: ["tech", "UGC"],
    },
  });

  // 5. Social accounts (mock handles)
  await prisma.socialAccount.create({
    data: {
      creatorId: creator1.id,
      agencyId: agency.id,
      platform: "instagram",
      handle: "@sam.creates",
      status: "active",
      meta: { follower_count: 12500 },
    },
  });
  await prisma.socialAccount.create({
    data: {
      creatorId: creator1.id,
      agencyId: agency.id,
      platform: "tiktok",
      handle: "@sam.creates",
      status: "active",
      meta: { follower_count: 8200 },
    },
  });
  await prisma.socialAccount.create({
    data: {
      creatorId: creator2.id,
      agencyId: agency.id,
      platform: "instagram",
      handle: "@riley.reels",
      status: "active",
      meta: { follower_count: 5600 },
    },
  });

  // 6. One campaign
  const campaign = await prisma.campaign.create({
    data: {
      agencyId: agency.id,
      name: "Spring 2025 Launch",
      description: "Product launch content for IG and TikTok",
      status: "active",
      platforms: ["instagram", "tiktok"],
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-04-30"),
    },
  });

  // 7. A few content tasks (Kanban)
  await prisma.contentTask.create({
    data: {
      agencyId: agency.id,
      campaignId: campaign.id,
      creatorId: creator1.id,
      assignedToUserId: managerUser.id,
      title: "IG Reel - Unboxing",
      description: "15s unboxing hook for product launch",
      platform: "instagram",
      targetSocialAccountIds: [],
      kanbanColumn: "backlog",
      orderIndex: 0,
      dueAt: new Date("2025-03-15"),
    },
  });
  await prisma.contentTask.create({
    data: {
      agencyId: agency.id,
      campaignId: campaign.id,
      creatorId: creator2.id,
      title: "TikTok - First impression",
      description: "30s first impression video",
      platform: "tiktok",
      targetSocialAccountIds: [],
      kanbanColumn: "in_progress",
      orderIndex: 1,
      dueAt: new Date("2025-03-20"),
    },
  });

  console.log("Seed completed:");
  console.log("  Agency:", agency.slug);
  console.log("  Users: alex@urie.demo (owner), jordan@urie.demo (manager), sam@urie.demo & riley@urie.demo (creators)");
  console.log("  Campaign:", campaign.name);
  console.log("  Content tasks: 2 (backlog + in_progress)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
