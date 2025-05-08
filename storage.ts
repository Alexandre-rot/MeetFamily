import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

// User functions
export const storage = {
  // User functions
  getUsers: async () => {
    return await db.select().from(schema.users);
  },
  
  getUserById: async (id: number) => {
    return await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1).then(res => res[0] || null);
  },
  
  getUserByUsername: async (username: string) => {
    return await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1).then(res => res[0] || null);
  },
  
  insertUser: async (user: schema.InsertUser) => {
    return await db.insert(schema.users).values(user).returning().then(res => res[0]);
  },
  
  updateUserProfile: async (id: number, profilePicture: string) => {
    return await db.update(schema.users)
      .set({ profilePicture })
      .where(eq(schema.users.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  // Meeting Agenda functions
  getMeetingAgendas: async () => {
    return await db.select().from(schema.meetingAgenda).orderBy(desc(schema.meetingAgenda.date));
  },
  
  getMeetingAgendaById: async (id: number) => {
    return await db.select().from(schema.meetingAgenda).where(eq(schema.meetingAgenda.id, id)).limit(1).then(res => res[0] || null);
  },
  
  insertMeetingAgenda: async (agenda: schema.InsertMeetingAgenda) => {
    return await db.insert(schema.meetingAgenda).values(agenda).returning().then(res => res[0]);
  },
  
  updateMeetingAgenda: async (id: number, agenda: Partial<schema.InsertMeetingAgenda>) => {
    return await db.update(schema.meetingAgenda)
      .set(agenda)
      .where(eq(schema.meetingAgenda.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  deleteMeetingAgenda: async (id: number) => {
    return await db.delete(schema.meetingAgenda).where(eq(schema.meetingAgenda.id, id)).returning().then(res => res[0]);
  },
  
  // Contribution functions
  getContributions: async () => {
    return await db.select().from(schema.contributions).orderBy(desc(schema.contributions.meetingDate));
  },
  
  getContributionById: async (id: number) => {
    return await db.select().from(schema.contributions).where(eq(schema.contributions.id, id)).limit(1).then(res => res[0] || null);
  },
  
  insertContribution: async (contribution: schema.InsertContribution) => {
    return await db.insert(schema.contributions).values(contribution).returning().then(res => res[0]);
  },
  
  updateContribution: async (id: number, totalAmount: number) => {
    return await db.update(schema.contributions)
      .set({ totalAmount })
      .where(eq(schema.contributions.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  deleteContribution: async (id: number) => {
    // First delete all members associated with this contribution
    await db.delete(schema.contributionMembers).where(eq(schema.contributionMembers.contributionId, id));
    // Then delete the contribution itself
    return await db.delete(schema.contributions).where(eq(schema.contributions.id, id)).returning().then(res => res[0]);
  },
  
  // Contribution Members functions
  getContributionMembers: async (contributionId: number) => {
    return await db.select().from(schema.contributionMembers).where(eq(schema.contributionMembers.contributionId, contributionId));
  },
  
  insertContributionMember: async (member: schema.InsertContributionMember) => {
    return await db.insert(schema.contributionMembers).values(member).returning().then(res => res[0]);
  },
  
  updateContributionMember: async (id: number, member: Partial<schema.InsertContributionMember>) => {
    return await db.update(schema.contributionMembers)
      .set(member)
      .where(eq(schema.contributionMembers.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  deleteContributionMember: async (id: number) => {
    return await db.delete(schema.contributionMembers).where(eq(schema.contributionMembers.id, id)).returning().then(res => res[0]);
  },
  
  // Announcement functions
  getAnnouncements: async () => {
    return await db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt));
  },
  
  getAnnouncementById: async (id: number) => {
    return await db.select().from(schema.announcements).where(eq(schema.announcements.id, id)).limit(1).then(res => res[0] || null);
  },
  
  insertAnnouncement: async (announcement: schema.InsertAnnouncement) => {
    return await db.insert(schema.announcements).values(announcement).returning().then(res => res[0]);
  },
  
  updateAnnouncementLikes: async (id: number, likesCount: number) => {
    return await db.update(schema.announcements)
      .set({ likesCount })
      .where(eq(schema.announcements.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  deleteAnnouncement: async (id: number) => {
    // First delete all comments and likes associated with this announcement
    await db.delete(schema.announcementComments).where(eq(schema.announcementComments.announcementId, id));
    await db.delete(schema.announcementLikes).where(eq(schema.announcementLikes.announcementId, id));
    // Then delete the announcement itself
    return await db.delete(schema.announcements).where(eq(schema.announcements.id, id)).returning().then(res => res[0]);
  },
  
  // Announcement Comments functions
  getAnnouncementComments: async (announcementId: number) => {
    return await db.select().from(schema.announcementComments)
      .where(eq(schema.announcementComments.announcementId, announcementId))
      .orderBy(schema.announcementComments.createdAt);
  },
  
  insertAnnouncementComment: async (comment: schema.InsertAnnouncementComment) => {
    return await db.insert(schema.announcementComments).values(comment).returning().then(res => res[0]);
  },
  
  // Announcement Likes functions
  getAnnouncementLike: async (announcementId: number, userId: number) => {
    return await db.select().from(schema.announcementLikes)
      .where(and(
        eq(schema.announcementLikes.announcementId, announcementId),
        eq(schema.announcementLikes.userId, userId)
      ))
      .limit(1)
      .then(res => res[0] || null);
  },
  
  insertAnnouncementLike: async (announcementId: number, userId: number) => {
    return await db.insert(schema.announcementLikes)
      .values({ announcementId, userId })
      .returning()
      .then(res => res[0]);
  },
  
  deleteAnnouncementLike: async (announcementId: number, userId: number) => {
    return await db.delete(schema.announcementLikes)
      .where(and(
        eq(schema.announcementLikes.announcementId, announcementId),
        eq(schema.announcementLikes.userId, userId)
      ))
      .returning()
      .then(res => res[0]);
  },
  
  // Photo Gallery functions
  getPhotos: async () => {
    return await db.select().from(schema.photos).orderBy(desc(schema.photos.createdAt));
  },
  
  insertPhoto: async (photo: schema.InsertPhoto) => {
    return await db.insert(schema.photos).values(photo).returning().then(res => res[0]);
  },
  
  deletePhoto: async (id: number) => {
    return await db.delete(schema.photos).where(eq(schema.photos.id, id)).returning().then(res => res[0]);
  },
  
  // Video Gallery functions
  getVideos: async () => {
    return await db.select().from(schema.videos).orderBy(desc(schema.videos.createdAt));
  },
  
  insertVideo: async (video: schema.InsertVideo) => {
    return await db.insert(schema.videos).values(video).returning().then(res => res[0]);
  },
  
  deleteVideo: async (id: number) => {
    return await db.delete(schema.videos).where(eq(schema.videos.id, id)).returning().then(res => res[0]);
  },
  
  // Family History functions
  getFamilyHistory: async () => {
    return await db.select().from(schema.familyHistory).orderBy(schema.familyHistory.date);
  },
  
  getFamilyHistoryById: async (id: number) => {
    return await db.select().from(schema.familyHistory).where(eq(schema.familyHistory.id, id)).limit(1).then(res => res[0] || null);
  },
  
  insertFamilyHistory: async (historyEvent: schema.InsertFamilyHistory) => {
    return await db.insert(schema.familyHistory).values(historyEvent).returning().then(res => res[0]);
  },
  
  updateFamilyHistory: async (id: number, historyEvent: Partial<schema.InsertFamilyHistory>) => {
    return await db.update(schema.familyHistory)
      .set(historyEvent)
      .where(eq(schema.familyHistory.id, id))
      .returning()
      .then(res => res[0]);
  },
  
  deleteFamilyHistory: async (id: number) => {
    return await db.delete(schema.familyHistory).where(eq(schema.familyHistory.id, id)).returning().then(res => res[0]);
  }
};
