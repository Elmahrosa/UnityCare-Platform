import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import {
  patientProfiles,
  doctorProfiles,
  appointments,
  prescriptions,
  medicalRecords,
  pharmacyProfiles,
  medicationInventory,
  emergencyRequests,
  iotDevices,
  vitalSigns,
  chatbotSessions,
  payments,
  piWallets,
  users,
  consultations,
} from "../drizzle/schema";

// ============================================================================
// PATIENT MANAGEMENT ROUTER
// ============================================================================

const patientRouter = router({
  // Get patient profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const profile = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, ctx.user.id))
      .limit(1);

    return profile[0] || null;
  }),

  // Update patient profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        dateOfBirth: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        bloodType: z.string().optional(),
        height: z.string().optional(),
        weight: z.string().optional(),
        allergies: z.string().optional(),
        medicalConditions: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyContactName: z.string().optional(),
        insuranceProvider: z.string().optional(),
        insurancePolicyNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would update patient profile
      return { success: true };
    }),

  // Get medical records
  getMedicalRecords: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const records = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, ctx.user.id));

    return records;
  }),

  // Get appointments
  getAppointments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const appointments_data = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, ctx.user.id));

    return appointments_data;
  }),

  // Book appointment
  bookAppointment: protectedProcedure
    .input(
      z.object({
        doctorId: z.number(),
        appointmentType: z.enum(["in_person", "telemedicine", "follow_up"]),
        scheduledAt: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would create appointment
      return { success: true, appointmentId: 1 };
    }),

  // Get prescriptions
  getPrescriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const prescriptions_data = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, ctx.user.id));

    return prescriptions_data;
  }),
});

// ============================================================================
// DOCTOR MANAGEMENT ROUTER
// ============================================================================

const doctorRouter = router({
  // Get doctor profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const profile = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, ctx.user.id))
      .limit(1);

    return profile[0] || null;
  }),

  // Get patient queue
  getPatientQueue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const queue = await db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, ctx.user.id));

    return queue;
  }),

  // Get consultation requests
  getConsultationRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const requests = await db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, ctx.user.id));

    return requests;
  }),

  // Create prescription
  createPrescription: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        medicationName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would create prescription
      return { success: true, prescriptionId: 1 };
    }),

  // Create medical record
  createMedicalRecord: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        diagnosis: z.string(),
        treatment: z.string(),
        medications: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would create medical record
      return { success: true, recordId: 1 };
    }),
});

// ============================================================================
// TELEMEDICINE ROUTER
// ============================================================================

const telehealthRouter = router({
  // Start consultation
  startConsultation: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would initialize video session
      return {
        success: true,
        sessionId: "session_" + Math.random().toString(36).substr(2, 9),
        videoToken: "token_" + Math.random().toString(36).substr(2, 9),
      };
    }),

  // End consultation
  endConsultation: protectedProcedure
    .input(
      z.object({
        consultationId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would end consultation
      return { success: true };
    }),

  // Get consultation history
  getConsultationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const history = await db.select().from(consultations);

    return history;
  }),
});

// ============================================================================
// PHARMACY ROUTER
// ============================================================================

const pharmacyRouter = router({
  // Get pharmacy profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const profile = await db
      .select()
      .from(pharmacyProfiles)
      .where(eq(pharmacyProfiles.userId, ctx.user.id))
      .limit(1);

    return profile[0] || null;
  }),

  // Get inventory
  getInventory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Would get pharmacy ID first, then inventory
    const inventory = await db.select().from(medicationInventory);

    return inventory;
  }),

  // Update inventory
  updateInventory: protectedProcedure
    .input(
      z.object({
        medicationId: z.number(),
        quantity: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would update inventory
      return { success: true };
    }),

  // Get pending prescriptions
  getPendingPrescriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const pending = await db.select().from(prescriptions);

    return pending;
  }),
});

// ============================================================================
// EMERGENCY DISPATCH ROUTER
// ============================================================================

const emergencyRouter = router({
  // Create emergency request
  createEmergencyRequest: publicProcedure
    .input(
      z.object({
        emergencyType: z.enum(["cardiac", "trauma", "respiratory", "stroke", "other"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        location: z.string(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        callerPhone: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would create emergency request
      return { success: true, emergencyId: 1 };
    }),

  // Get emergency requests (for dispatchers)
  getEmergencyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const requests = await db.select().from(emergencyRequests);

    return requests;
  }),

  // Update ambulance location
  updateAmbulanceLocation: protectedProcedure
    .input(
      z.object({
        ambulanceId: z.number(),
        latitude: z.string(),
        longitude: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would update location
      return { success: true };
    }),
});

// ============================================================================
// IOT MONITORING ROUTER
// ============================================================================

const iotRouter = router({
  // Get vital signs
  getVitalSigns: protectedProcedure
    .input(
      z.object({
        patientId: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const signs = await db.select().from(vitalSigns);

      return signs.slice(0, input.limit);
    }),

  // Record vital signs
  recordVitalSigns: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        heartRate: z.number().optional(),
        oxygenLevel: z.number().optional(),
        systolicBP: z.number().optional(),
        diastolicBP: z.number().optional(),
        temperature: z.number().optional(),
        glucoseLevel: z.number().optional(),
        respiratoryRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would record vital signs
      return { success: true, vitalSignsId: 1 };
    }),

  // Get IoT devices
  getDevices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const devices = await db.select().from(iotDevices);

    return devices;
  }),
});

// ============================================================================
// AI CHATBOT ROUTER
// ============================================================================

const chatbotRouter = router({
  // Start chatbot session
  startSession: publicProcedure
    .input(
      z.object({
        language: z.enum(["en", "ar", "fr"]).default("en"),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Implementation would create session
      return {
        success: true,
        sessionId: "session_" + Math.random().toString(36).substr(2, 9),
      };
    }),

  // Send message to chatbot
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Implementation would process message with AI
      return {
        success: true,
        response: "This is a health guidance response",
        symptoms: [],
        recommendations: [],
      };
    }),

  // Get session history
  getSessionHistory: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const session = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionId, input.sessionId))
        .limit(1);

      return session[0] || null;
    }),
});

// ============================================================================
// PAYMENT ROUTER
// ============================================================================

const paymentRouter = router({
  // Create payment
  createPayment: protectedProcedure
    .input(
      z.object({
        transactionType: z.enum(["consultation", "prescription", "service", "refund"]),
        referenceId: z.number(),
        amount: z.string(),
        paymentMethod: z.enum(["pi_network", "credit_card", "bank_transfer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation would create payment
      return { success: true, paymentId: 1 };
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const history = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, ctx.user.id));

    return history;
  }),

  // Get Pi wallet
  getPiWallet: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const wallet = await db
      .select()
      .from(piWallets)
      .where(eq(piWallets.userId, ctx.user.id))
      .limit(1);

    return wallet[0] || null;
  }),
});

// ============================================================================
// ADMIN ROUTER
// ============================================================================

const adminRouter = router({
  // Get all users
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const all_users = await db.select().from(users);

    return all_users;
  }),

  // Get system metrics
  getSystemMetrics: protectedProcedure.query(async ({ ctx }) => {
    return {
      totalUsers: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      systemHealth: "operational",
    };
  }),

  // Get analytics
  getAnalytics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "year"]),
      })
    )
    .query(async ({ ctx, input }) => {
      return {
        consultations: 0,
        prescriptions: 0,
        emergencies: 0,
        revenue: 0,
      };
    }),
});

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  patient: patientRouter,
  doctor: doctorRouter,
  telehealth: telehealthRouter,
  pharmacy: pharmacyRouter,
  emergency: emergencyRouter,
  iot: iotRouter,
  chatbot: chatbotRouter,
  payment: paymentRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
