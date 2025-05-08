import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    // Add a default user if none exists
    const existingUsers = await db.select().from(schema.users).limit(1);
    
    if (existingUsers.length === 0) {
      await db.insert(schema.users).values({
        username: "family_admin",
        password: "password123", // In production, this should be hashed
        profilePicture: "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
      });
      
      console.log("Added default user");
    }

    // Get the user ID for foreign key relations
    const user = await db.select().from(schema.users).limit(1);
    const userId = user[0]?.id;

    if (!userId) {
      console.log("No user found, skipping seed data");
      return;
    }

    // Add sample meeting agendas
    const existingAgendas = await db.select().from(schema.meetingAgenda).limit(1);
    
    if (existingAgendas.length === 0) {
      await db.insert(schema.meetingAgenda).values([
        {
          title: "Réunion familiale mensuelle",
          date: new Date("2023-11-25T16:00:00"),
          location: "Chez Tante Marie - Quartier Akwa",
          description: "Discussion du budget familial 2024, préparation des fêtes de fin d'année, mise à jour sur les études des enfants.",
          userId: userId
        },
        {
          title: "Préparation mariage de Cousin Jacques",
          date: new Date("2023-12-03T14:30:00"),
          location: "Salle communautaire - Bonanjo",
          description: "Organisation de la cérémonie, détermination des contributions familiales, logistique pour les invités.",
          userId: userId
        }
      ]);
      
      console.log("Added sample meeting agendas");
    }

    // Add sample contributions and members
    const existingContributions = await db.select().from(schema.contributions).limit(1);
    
    if (existingContributions.length === 0) {
      const [contribution] = await db.insert(schema.contributions).values({
        meetingNumber: 11,
        meetingDate: new Date("2023-10-15"),
        userId: userId,
        totalAmount: 30000
      }).returning();

      await db.insert(schema.contributionMembers).values([
        {
          contributionId: contribution.id,
          lastName: "Mbarga",
          firstName: "Thomas",
          amount: 10000
        },
        {
          contributionId: contribution.id,
          lastName: "Nguema",
          firstName: "Marie",
          amount: 15000
        },
        {
          contributionId: contribution.id,
          lastName: "Ateba",
          firstName: "Paul",
          amount: 5000
        }
      ]);

      // Add another contribution record
      await db.insert(schema.contributions).values({
        meetingNumber: 10,
        meetingDate: new Date("2023-09-17"),
        userId: userId,
        totalAmount: 38500
      });
      
      console.log("Added sample contributions and members");
    }

    // Add sample announcements and comments
    const existingAnnouncements = await db.select().from(schema.announcements).limit(1);
    
    if (existingAnnouncements.length === 0) {
      const [announcement] = await db.insert(schema.announcements).values({
        userId: userId,
        text: "Chers membres de la famille, n'oubliez pas notre réunion importante ce dimanche. Nous parlerons du projet de construction familiale.",
        likesCount: 12
      }).returning();

      await db.insert(schema.announcementComments).values([
        {
          announcementId: announcement.id,
          userId: userId,
          text: "Je serai présente. Est-ce que nous devons apporter quelque chose?"
        },
        {
          announcementId: announcement.id,
          userId: userId,
          text: "Juste votre présence, merci Sophie!"
        }
      ]);

      // Add another announcement with audio
      await db.insert(schema.announcements).values({
        userId: userId,
        text: "Félicitations à notre cousin Pierre pour son diplôme d'ingénieur! Nous sommes tous fiers de toi!",
        audioUrl: "/sample-audio.mp3", // This would be a real URL in production
        likesCount: 24
      });
      
      console.log("Added sample announcements and comments");
    }

    // Add sample photos
    const existingPhotos = await db.select().from(schema.photos).limit(1);
    
    if (existingPhotos.length === 0) {
      await db.insert(schema.photos).values([
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1643383726824-75a41f1d8b64?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Réunion familiale"
        },
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Fête de fin d'année"
        },
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1613336026275-d6d473084e85?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Pique-nique familial"
        },
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Anniversaire de Grand-mère"
        },
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1601935111741-ae98b2b230b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Vacances en famille"
        },
        {
          userId: userId,
          url: "https://images.unsplash.com/photo-1519056312994-33952f238fac?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
          title: "Anniversaire des jumeaux"
        }
      ]);
      
      console.log("Added sample photos");
    }

    // Add sample videos
    const existingVideos = await db.select().from(schema.videos).limit(1);
    
    if (existingVideos.length === 0) {
      await db.insert(schema.videos).values([
        {
          userId: userId,
          url: "/sample-video-1.mp4", // This would be a real URL in production
          title: "Fête familiale - Mai 2023",
          description: "Notre grande fête annuelle",
          duration: "3:45",
          thumbnailUrl: "https://images.unsplash.com/photo-1516057747705-0609aaf473e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        },
        {
          userId: userId,
          url: "/sample-video-2.mp4", // This would be a real URL in production
          title: "Célébration d'anniversaire - Tante Emma",
          description: "80 ans de Tante Emma",
          duration: "8:12",
          thumbnailUrl: "https://images.unsplash.com/photo-1558612125-a4df1536e871?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        }
      ]);
      
      console.log("Added sample videos");
    }

    // Add sample family history events
    const existingHistory = await db.select().from(schema.familyHistory).limit(1);
    
    if (existingHistory.length === 0) {
      await db.insert(schema.familyHistory).values([
        {
          userId: userId,
          title: "Fondation de la famille Mbarga",
          date: "1925",
          description: "Notre ancêtre Jean-Baptiste Mbarga s'est installé dans le village après la guerre. Il a épousé Marie Eyenga et a fondé notre lignée familiale.",
          imageUrls: ["https://images.unsplash.com/photo-1573511860302-28c10b7add53?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80", 
                     "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"]
        },
        {
          userId: userId,
          title: "Construction de la maison familiale",
          date: "1962",
          description: "La grande maison familiale à Douala a été construite par nos parents. Cette maison reste un lieu de rassemblement pour toute la famille.",
          imageUrls: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"]
        },
        {
          userId: userId,
          title: "Première réunion familiale officielle",
          date: "1994",
          description: "Nous avons commencé à organiser des réunions familiales régulières pour maintenir nos liens et soutenir les membres dans leurs projets.",
          imageUrls: []
        }
      ]);
      
      console.log("Added sample family history events");
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
