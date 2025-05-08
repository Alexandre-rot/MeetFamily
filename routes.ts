import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import * as schema from "@shared/schema";
import { User } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', // Images
      'audio/mpeg', 'audio/wav', 'audio/ogg', // Audio
      'video/mp4', 'video/webm', 'video/ogg' // Video
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, audio, and videos are allowed.'), false);
    }
  }
});

// Set a mock userId for now (in a real app, this would come from authentication)
const MOCK_USER_ID = 1;

// Helper function to validate request with Zod schema
function validateRequest<T>(schema: z.ZodType<T>, data: unknown): { success: true, data: T } | { success: false, error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return { success: false, error: validationError.message };
    }
    return { success: false, error: 'Invalid data provided' };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiPrefix = '/api';

  // Serve static files from the public directory
  app.use(express.static('public'));
  
  // Serve static files from uploads
  app.use('/uploads', express.static(uploadDir));

  // Get current user
  app.get(`${apiPrefix}/user`, async (req, res) => {
    try {
      const user = await storage.getUserById(MOCK_USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update profile picture
  app.post(`${apiPrefix}/user/profile-picture`, upload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      const user = await storage.updateUserProfile(MOCK_USER_ID, filePath);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json({ message: "Profile picture updated successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // === MEETING AGENDA ROUTES ===
  // Get all meeting agendas
  app.get(`${apiPrefix}/meeting-agendas`, async (req, res) => {
    try {
      const agendas = await storage.getMeetingAgendas();
      res.json(agendas);
    } catch (error) {
      console.error("Error fetching meeting agendas:", error);
      res.status(500).json({ message: "Failed to fetch meeting agendas" });
    }
  });

  // Get a specific meeting agenda
  app.get(`${apiPrefix}/meeting-agendas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const agenda = await storage.getMeetingAgendaById(id);
      if (!agenda) {
        return res.status(404).json({ message: "Meeting agenda not found" });
      }

      res.json(agenda);
    } catch (error) {
      console.error("Error fetching meeting agenda:", error);
      res.status(500).json({ message: "Failed to fetch meeting agenda" });
    }
  });

  // Create a new meeting agenda
  app.post(`${apiPrefix}/meeting-agendas`, async (req, res) => {
    try {
      const validation = validateRequest(schema.insertMeetingAgendaSchema, {
        ...req.body,
        userId: MOCK_USER_ID
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newAgenda = await storage.insertMeetingAgenda(validation.data);
      res.status(201).json(newAgenda);
    } catch (error) {
      console.error("Error creating meeting agenda:", error);
      res.status(500).json({ message: "Failed to create meeting agenda" });
    }
  });

  // Update a meeting agenda
  app.put(`${apiPrefix}/meeting-agendas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validation = validateRequest(schema.insertMeetingAgendaSchema.partial(), req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const agenda = await storage.getMeetingAgendaById(id);
      if (!agenda) {
        return res.status(404).json({ message: "Meeting agenda not found" });
      }

      const updatedAgenda = await storage.updateMeetingAgenda(id, validation.data);
      res.json(updatedAgenda);
    } catch (error) {
      console.error("Error updating meeting agenda:", error);
      res.status(500).json({ message: "Failed to update meeting agenda" });
    }
  });

  // Delete a meeting agenda
  app.delete(`${apiPrefix}/meeting-agendas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const agenda = await storage.getMeetingAgendaById(id);
      if (!agenda) {
        return res.status(404).json({ message: "Meeting agenda not found" });
      }

      await storage.deleteMeetingAgenda(id);
      res.json({ message: "Meeting agenda deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting agenda:", error);
      res.status(500).json({ message: "Failed to delete meeting agenda" });
    }
  });

  // === CONTRIBUTION ROUTES ===
  // Get all contributions
  app.get(`${apiPrefix}/contributions`, async (req, res) => {
    try {
      const contributions = await storage.getContributions();
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  // Get a specific contribution with its members
  app.get(`${apiPrefix}/contributions/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const contribution = await storage.getContributionById(id);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const members = await storage.getContributionMembers(id);
      res.json({ ...contribution, members });
    } catch (error) {
      console.error("Error fetching contribution:", error);
      res.status(500).json({ message: "Failed to fetch contribution" });
    }
  });

  // Create a new contribution
  app.post(`${apiPrefix}/contributions`, async (req, res) => {
    try {
      const validation = validateRequest(schema.insertContributionSchema, {
        ...req.body,
        userId: MOCK_USER_ID
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newContribution = await storage.insertContribution(validation.data);
      res.status(201).json(newContribution);
    } catch (error) {
      console.error("Error creating contribution:", error);
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  // Add a member to a contribution
  app.post(`${apiPrefix}/contributions/:id/members`, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      if (isNaN(contributionId)) {
        return res.status(400).json({ message: "Invalid contribution ID" });
      }

      const contribution = await storage.getContributionById(contributionId);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const validation = validateRequest(schema.insertContributionMemberSchema, {
        ...req.body,
        contributionId
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newMember = await storage.insertContributionMember(validation.data);
      
      // Update the total amount
      const members = await storage.getContributionMembers(contributionId);
      const totalAmount = members.reduce((sum, member) => sum + member.amount, 0);
      await storage.updateContribution(contributionId, totalAmount);

      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error adding contribution member:", error);
      res.status(500).json({ message: "Failed to add contribution member" });
    }
  });

  // Update a contribution member
  app.put(`${apiPrefix}/contributions/members/:id`, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const validation = validateRequest(schema.insertContributionMemberSchema.partial(), req.body);
      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const updatedMember = await storage.updateContributionMember(memberId, validation.data);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Update the total amount
      const members = await storage.getContributionMembers(updatedMember.contributionId);
      const totalAmount = members.reduce((sum, member) => sum + member.amount, 0);
      await storage.updateContribution(updatedMember.contributionId, totalAmount);

      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating contribution member:", error);
      res.status(500).json({ message: "Failed to update contribution member" });
    }
  });

  // Delete a contribution member
  app.delete(`${apiPrefix}/contributions/members/:id`, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const member = await storage.deleteContributionMember(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Update the total amount
      const members = await storage.getContributionMembers(member.contributionId);
      const totalAmount = members.reduce((sum, member) => sum + member.amount, 0);
      await storage.updateContribution(member.contributionId, totalAmount);

      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Error deleting contribution member:", error);
      res.status(500).json({ message: "Failed to delete contribution member" });
    }
  });

  // Delete a contribution
  app.delete(`${apiPrefix}/contributions/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const contribution = await storage.getContributionById(id);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      await storage.deleteContribution(id);
      res.json({ message: "Contribution deleted successfully" });
    } catch (error) {
      console.error("Error deleting contribution:", error);
      res.status(500).json({ message: "Failed to delete contribution" });
    }
  });

  // === ANNOUNCEMENT ROUTES ===
  // Get all announcements with comments
  app.get(`${apiPrefix}/announcements`, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      const announcementsWithComments = await Promise.all(
        announcements.map(async (announcement) => {
          const comments = await storage.getAnnouncementComments(announcement.id);
          return { ...announcement, comments };
        })
      );
      res.json(announcementsWithComments);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Create a new announcement
  app.post(`${apiPrefix}/announcements`, async (req, res) => {
    try {
      const validation = validateRequest(schema.insertAnnouncementSchema, {
        ...req.body,
        userId: MOCK_USER_ID
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newAnnouncement = await storage.insertAnnouncement(validation.data);
      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Upload audio for announcement
  app.post(`${apiPrefix}/announcements/audio`, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      res.json({ audioUrl: filePath });
    } catch (error) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ message: "Failed to upload audio" });
    }
  });

  // Add a comment to an announcement
  app.post(`${apiPrefix}/announcements/:id/comments`, async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      if (isNaN(announcementId)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }

      const announcement = await storage.getAnnouncementById(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const validation = validateRequest(schema.insertAnnouncementCommentSchema, {
        ...req.body,
        announcementId,
        userId: MOCK_USER_ID
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newComment = await storage.insertAnnouncementComment(validation.data);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Like/unlike an announcement
  app.post(`${apiPrefix}/announcements/:id/like`, async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      if (isNaN(announcementId)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }

      const announcement = await storage.getAnnouncementById(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const existingLike = await storage.getAnnouncementLike(announcementId, MOCK_USER_ID);
      
      if (existingLike) {
        // User already liked, so unlike
        await storage.deleteAnnouncementLike(announcementId, MOCK_USER_ID);
        await storage.updateAnnouncementLikes(announcementId, Math.max(0, announcement.likesCount - 1));
        res.json({ liked: false, likesCount: announcement.likesCount - 1 });
      } else {
        // User hasn't liked, so like
        await storage.insertAnnouncementLike(announcementId, MOCK_USER_ID);
        await storage.updateAnnouncementLikes(announcementId, announcement.likesCount + 1);
        res.json({ liked: true, likesCount: announcement.likesCount + 1 });
      }
    } catch (error) {
      console.error("Error liking/unliking announcement:", error);
      res.status(500).json({ message: "Failed to like/unlike announcement" });
    }
  });

  // === PHOTO GALLERY ROUTES ===
  // Get all photos
  app.get(`${apiPrefix}/photos`, async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Upload a photo
  app.post(`${apiPrefix}/photos`, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      const title = req.body.title || req.file.originalname;
      const description = req.body.description || '';

      const newPhoto = await storage.insertPhoto({
        userId: MOCK_USER_ID,
        url: filePath,
        title,
        description
      });

      res.status(201).json(newPhoto);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // === VIDEO GALLERY ROUTES ===
  // Get all videos
  app.get(`${apiPrefix}/videos`, async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Upload a video
  app.post(`${apiPrefix}/videos`, upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/${req.file.filename}`;
      const title = req.body.title || req.file.originalname;
      const description = req.body.description || '';
      const duration = req.body.duration || '';
      const thumbnailUrl = req.body.thumbnailUrl || '';

      const newVideo = await storage.insertVideo({
        userId: MOCK_USER_ID,
        url: filePath,
        title,
        description,
        duration,
        thumbnailUrl
      });

      res.status(201).json(newVideo);
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // === FAMILY HISTORY ROUTES ===
  // Get all family history events
  app.get(`${apiPrefix}/family-history`, async (req, res) => {
    try {
      const historyEvents = await storage.getFamilyHistory();
      res.json(historyEvents);
    } catch (error) {
      console.error("Error fetching family history:", error);
      res.status(500).json({ message: "Failed to fetch family history" });
    }
  });

  // Create a new family history event
  app.post(`${apiPrefix}/family-history`, async (req, res) => {
    try {
      const validation = validateRequest(schema.insertFamilyHistorySchema, {
        ...req.body,
        userId: MOCK_USER_ID,
        imageUrls: req.body.imageUrls || []
      });

      if (!validation.success) {
        return res.status(400).json({ message: validation.error });
      }

      const newHistoryEvent = await storage.insertFamilyHistory(validation.data);
      res.status(201).json(newHistoryEvent);
    } catch (error) {
      console.error("Error creating family history event:", error);
      res.status(500).json({ message: "Failed to create family history event" });
    }
  });

  // Upload images for family history
  app.post(`${apiPrefix}/family-history/images`, upload.array('images', 5), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const filePaths = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
      res.json({ imageUrls: filePaths });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import express from "express";
