import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meeting Agenda table
export const meetingAgenda = pgTable("meeting_agenda", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meeting Contribution table
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  meetingNumber: integer("meeting_number").notNull(),
  meetingDate: timestamp("meeting_date").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  totalAmount: integer("total_amount").default(0).notNull(),
});

// Contribution Members table
export const contributionMembers = pgTable("contribution_members", {
  id: serial("id").primaryKey(),
  contributionId: integer("contribution_id").references(() => contributions.id).notNull(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  text: text("text"),
  audioUrl: text("audio_url"),
  likesCount: integer("likes_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcement Comments table
export const announcementComments = pgTable("announcement_comments", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcement Likes table
export const announcementLikes = pgTable("announcement_likes", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Photos Gallery table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Videos Gallery table
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  duration: text("duration"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family History table
export const familyHistory = pgTable("family_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  imageUrls: json("image_urls").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const meetingAgendaRelations = relations(meetingAgenda, ({ one }) => ({
  user: one(users, { fields: [meetingAgenda.userId], references: [users.id] }),
}));

export const contributionsRelations = relations(contributions, ({ one, many }) => ({
  user: one(users, { fields: [contributions.userId], references: [users.id] }),
  members: many(contributionMembers),
}));

export const contributionMembersRelations = relations(contributionMembers, ({ one }) => ({
  contribution: one(contributions, { fields: [contributionMembers.contributionId], references: [contributions.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  user: one(users, { fields: [announcements.userId], references: [users.id] }),
  comments: many(announcementComments),
  likes: many(announcementLikes),
}));

export const announcementCommentsRelations = relations(announcementComments, ({ one }) => ({
  announcement: one(announcements, { fields: [announcementComments.announcementId], references: [announcements.id] }),
  user: one(users, { fields: [announcementComments.userId], references: [users.id] }),
}));

export const announcementLikesRelations = relations(announcementLikes, ({ one }) => ({
  announcement: one(announcements, { fields: [announcementLikes.announcementId], references: [announcements.id] }),
  user: one(users, { fields: [announcementLikes.userId], references: [users.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, { fields: [photos.userId], references: [users.id] }),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
}));

export const familyHistoryRelations = relations(familyHistory, ({ one }) => ({
  user: one(users, { fields: [familyHistory.userId], references: [users.id] }),
}));

// Schema Validations
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  profilePicture: (schema) => schema.optional(),
});

export const insertMeetingAgendaSchema = createInsertSchema(meetingAgenda, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
});

export const insertContributionSchema = createInsertSchema(contributions, {
  meetingNumber: (schema) => schema.min(1, "Meeting number must be at least 1"),
});

export const insertContributionMemberSchema = createInsertSchema(contributionMembers, {
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  amount: (schema) => schema.min(0, "Amount cannot be negative"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements, {
  text: (schema) => schema.optional(),
  audioUrl: (schema) => schema.optional(),
}).refine((data) => data.text || data.audioUrl, {
  message: "Either text or audio must be provided",
  path: ["text"],
});

export const insertAnnouncementCommentSchema = createInsertSchema(announcementComments, {
  text: (schema) => schema.min(1, "Comment cannot be empty"),
});

export const insertPhotoSchema = createInsertSchema(photos, {
  url: (schema) => schema.min(5, "URL must be valid"),
  title: (schema) => schema.optional(),
  description: (schema) => schema.optional(),
});

export const insertVideoSchema = createInsertSchema(videos, {
  url: (schema) => schema.min(5, "URL must be valid"),
  title: (schema) => schema.optional(),
  description: (schema) => schema.optional(),
  duration: (schema) => schema.optional(),
  thumbnailUrl: (schema) => schema.optional(),
});

export const insertFamilyHistorySchema = createInsertSchema(familyHistory, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MeetingAgenda = typeof meetingAgenda.$inferSelect;
export type InsertMeetingAgenda = z.infer<typeof insertMeetingAgendaSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type ContributionMember = typeof contributionMembers.$inferSelect;
export type InsertContributionMember = z.infer<typeof insertContributionMemberSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type AnnouncementComment = typeof announcementComments.$inferSelect;
export type InsertAnnouncementComment = z.infer<typeof insertAnnouncementCommentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type FamilyHistory = typeof familyHistory.$inferSelect;
export type InsertFamilyHistory = z.infer<typeof insertFamilyHistorySchema>;
