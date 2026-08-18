/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./src/dbHelper";
import {
  User,
  TestRoom,
  Question,
  StudentRoomRequest,
  Submission,
  Answer,
} from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for Gemini
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined in the environment secrets.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// AUTHENTICATION HELPER (Token encoder/decoder)
// ----------------------------------------------------
const SECRET_PREFIX = "QUANT_SEC_";

function generateToken(user: User): string {
  const payload = {
    id: user.id,
    role: user.role,
    full_name: user.full_name,
    email: user.email,
    institution: user.institution,
    student_id: user.student_id,
    department: user.department,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(req: Request): User | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const decodedStr = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(decodedStr);

    // Find matched user
    const user = db.getUsers().find((u) => u.id === parsed.id);
    if (!user || user.status === "banned") {
      return null;
    }
    return user;
  } catch (err) {
    return null;
  }
}

// Middleware to secure routes
const authenticate = (req: Request, res: Response, next: () => void) => {
  const user = verifyToken(req);
  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized access: Invalid or expired token" });
  }
  (req as any).user = user;
  next();
};

// ----------------------------------------------------
// ENDPOINTS
// ----------------------------------------------------

// 1. Auth Endpoint: Register
app.post("/api/auth/register", (req: Request, res: Response) => {
  const {
    role,
    full_name,
    email,
    password,
    institution,
    student_id,
    department,
  } = req.body;

  if (!role || !full_name || !email || !password || !institution) {
    return res
      .status(400)
      .json({ error: "Missing required registration parameters." });
  }

  const existingUsers = db.getUsers();
  if (
    existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())
  ) {
    return res
      .status(400)
      .json({ error: "An account with this email address already exists." });
  }

  if (role === "student") {
    if (!student_id) {
      return res.status(400).json({ error: "Student ID is required." });
    }
    const studentIdClean = student_id.trim();
    if (
      existingUsers.some(
        (u) =>
          u.role === "student" &&
          u.student_id === studentIdClean &&
          u.institution.toLowerCase() === institution.toLowerCase(),
      )
    ) {
      return res
        .status(400)
        .json({
          error: "This Student ID is already registered in your institution.",
        });
    }
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    role,
    full_name,
    email,
    password_hash: password, // simple comparison storage
    institution,
    student_id: role === "student" ? student_id : undefined,
    department: role === "teacher" ? department : undefined,
    created_at: new Date().toISOString(),
    status: "active",
  };

  db.addUser(newUser);

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      role: newUser.role,
      full_name: newUser.full_name,
      email: newUser.email,
      institution: newUser.institution,
      student_id: newUser.student_id,
      department: newUser.department,
      status: newUser.status,
    },
  });
});

// 2. Auth Endpoint: Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db
    .getUsers()
    .find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (user.status === "banned") {
    return res
      .status(403)
      .json({ error: "This account has been banned by an administrator." });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      institution: user.institution,
      student_id: user.student_id,
      department: user.department,
      status: user.status,
    },
  });
});

// 3. Auth Endpoint: Me (Session restore)
app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: "Invalid session." });
  }
  res.json({
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      institution: user.institution,
      student_id: user.student_id,
      department: user.department,
      status: user.status,
    },
  });
});

// ----------------------------------------------------
// TEST ROOM ENDPOINTS
// ----------------------------------------------------

// GET /api/rooms - returns all available rooms
app.get("/api/rooms", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  let rooms = db.getRooms();

  if (user.role === "teacher") {
    // Only return teacher's created rooms
    rooms = rooms.filter((r) => r.teacher_id === user.id);
  } else if (user.role === "student") {
    // Standard student sees all active / archived rooms in their institution or universally
    rooms = rooms.filter((r) => r.status !== "draft");
  }

  res.json({ rooms });
});

// POST /api/rooms - Create a testing room
app.post("/api/rooms", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== "teacher" && user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Teacher privileges required." });
  }

  const { title, subject, password, time_limit, approval_mode } = req.body;
  if (!title || !subject || !time_limit || !approval_mode) {
    return res
      .status(400)
      .json({
        error:
          "Missing title, subject, time limit, or acceptance approval mode.",
      });
  }

  const newRoom: TestRoom = {
    id: `room_${Date.now()}`,
    teacher_id: user.id,
    title,
    subject,
    password: password || undefined,
    time_limit: parseInt(time_limit) || 30,
    approval_mode,
    status: "draft",
    created_at: new Date().toISOString(),
  };

  db.addRoom(newRoom);
  res.status(201).json({ room: newRoom });
});

// GET /api/rooms/:id - Get discrete room details
app.get("/api/rooms/:id", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const room = db.getRooms().find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: "Testing room not found." });
  }

  // Find questions in this room
  let questions = db.getQuestions().filter((q) => q.room_id === room.id);

  // If student is fetching & hasn't completed/submitted, strip out correct answers!
  if (user.role === "student") {
    const submission = db
      .getSubmissions()
      .find((s) => s.room_id === room.id && s.student_id === user.id);
    if (!submission && room.status === "active") {
      questions = questions.map((q) => {
        const { correct_answer, ...stripped } = q;
        return stripped as Question; // Hide answer key
      });
    }
  }

  // Check if student has request status
  const requests = db
    .getRequests()
    .filter((reqObj) => reqObj.room_id === room.id);
  const userRequest = requests.find((reqObj) => reqObj.student_id === user.id);

  res.json({
    room,
    questions,
    userRequestStatus: userRequest ? userRequest.status : null,
    joinRequestId: userRequest ? userRequest.id : null,
  });
});

// DELETE /api/rooms/:id - Delete room
app.delete("/api/rooms/:id", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const room = db.getRooms().find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  if (user.role !== "admin" && room.teacher_id !== user.id) {
    return res
      .status(403)
      .json({ error: "Unauthorized to delete this testing room." });
  }

  db.deleteRoom(room.id);
  res.json({ message: "Testing room deleted successfully." });
});

// POST /api/rooms/:id/questions - Update questions inside a room
app.post(
  "/api/rooms/:id/questions",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const room = db.getRooms().find((r) => r.id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Testing room not found." });
    }

    if (room.teacher_id !== user.id && user.role !== "admin") {
      return res
        .status(403)
        .json({
          error: "Access denied: You are not the teacher of this room.",
        });
    }

    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res
        .status(400)
        .json({ error: "Questions must be sent as an array." });
    }

    const cleanQuestions: Question[] = questions.map(
      (q: any, index: number) => ({
        id: q.id || `q_${room.id}_${Date.now()}_${index}`,
        room_id: room.id,
        question_text: q.question_text || "Untitled Question",
        option_a: q.option_a || "Option A",
        option_b: q.option_b || "Option B",
        option_c: q.option_c || "Option C",
        option_d: q.option_d || "Option D",
        correct_answer: q.correct_answer || "a",
        points: parseInt(q.points) || 10,
      }),
    );

    db.setQuestionsForRoom(room.id, cleanQuestions);
    res.json({ questions: cleanQuestions });
  },
);

// POST /api/rooms/:id/start - Activate testing room
app.post(
  "/api/rooms/:id/start",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const room = db.getRooms().find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (room.teacher_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied." });
    }

    db.updateRoom(room.id, { status: "active" });
    db.clearRequestsForRoom(room.id);
    res.json({ status: "active" });
  },
);

// POST /api/rooms/:id/archive - End & archive testing room
app.post(
  "/api/rooms/:id/archive",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const room = db.getRooms().find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (room.teacher_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied." });
    }

    db.updateRoom(room.id, { status: "archived" });
    res.json({ status: "archived" });
  },
);

// ----------------------------------------------------
// JOIN / APPROVAL SESSIONS
// ----------------------------------------------------

// POST /api/rooms/:id/join - Student requesting to join
app.post("/api/rooms/:id/join", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== "student") {
    return res
      .status(400)
      .json({ error: "Only student logins can join active test rooms." });
  }

  const room = db.getRooms().find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: "Testing room not found" });

  if (room.status !== "active") {
    return res
      .status(400)
      .json({ error: "This testing room is not currently active." });
  }

  // Check user password
  const { password } = req.body;
  if (room.password && room.password !== password) {
    return res
      .status(401)
      .json({ error: "Invalid room password. Verification failed." });
  }

  // Check if a request already exists
  const existingRequests = db.getRequests();
  const matched = existingRequests.find(
    (r) => r.room_id === room.id && r.student_id === user.id,
  );

  if (matched) {
    return res.json({ status: matched.status, joinRequestId: matched.id });
  }

  // Determine final status based on approval mode
  const requestStatus = room.approval_mode === "auto" ? "approved" : "pending";

  const newRequest: StudentRoomRequest = {
    id: `req_${Date.now()}`,
    student_id: user.id,
    student_name: user.full_name,
    student_email: user.email,
    student_id_number: user.student_id || "N/A",
    room_id: room.id,
    status: requestStatus,
    requested_at: new Date().toISOString(),
  };

  db.addRequest(newRequest);
  res.json({ status: requestStatus, joinRequestId: newRequest.id });
});

// GET /api/rooms/:id/requests - Fetch student join requests
app.get(
  "/api/rooms/:id/requests",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const room = db.getRooms().find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (room.teacher_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied." });
    }

    const roomRequests = db
      .getRequests()
      .filter((reqObj) => reqObj.room_id === room.id);
    res.json({ requests: roomRequests });
  },
);

// POST /api/requests/:reqId/approve - Authorize student immediately
app.post(
  "/api/requests/:reqId/approve",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ error: "Denied credentials." });
    }

    db.updateRequest(req.params.reqId, "approved");
    res.json({ success: true, status: "approved" });
  },
);

// POST /api/requests/:reqId/reject - Reject student entry
app.post(
  "/api/requests/:reqId/reject",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({ error: "Denied credentials." });
    }

    db.updateRequest(req.params.reqId, "rejected");
    res.json({ success: true, status: "rejected" });
  },
);

// POST /api/rooms/:id/approve-all - Approve all pending students in one click
app.post(
  "/api/rooms/:id/approve-all",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const room = db.getRooms().find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (room.teacher_id !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied." });
    }

    const pendings = db
      .getRequests()
      .filter(
        (reqObj) => reqObj.room_id === room.id && reqObj.status === "pending",
      );
    for (const pending of pendings) {
      db.updateRequest(pending.id, "approved");
    }

    res.json({ success: true, count: pendings.length });
  },
);

// ----------------------------------------------------
// EXAM SUBMISSION & GRADING SYSTEM
// ----------------------------------------------------

// POST /api/rooms/:room_id/submit - Submit quiz inputs
app.post(
  "/api/rooms/:room_id/submit",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const roomId = req.params.room_id;

    const room = db.getRooms().find((r) => r.id === roomId);
    if (!room)
      return res.status(404).json({ error: "Testing room not found." });

    const { answers: studentSelections, cheatingCount, timestamps } = req.body;
    // studentSelections format: { [questionId: string]: 'a' | 'b' | 'c' | 'd' }

    // Get true questions list
    const roomQuestions = db.getQuestions().filter((q) => q.room_id === roomId);
    let studentScore = 0;
    let totalAvailablePoints = 0;
    const generatedAnswers: Answer[] = [];

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    for (const q of roomQuestions) {
      totalAvailablePoints += q.points;
      const selected = studentSelections?.[q.id];
      const isCorrect = selected === q.correct_answer;

      if (isCorrect) {
        studentScore += q.points;
      }

      generatedAnswers.push({
        id: `ans_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        submission_id: submissionId,
        question_id: q.id,
        selected_answer: selected || "a", // default to blank fallback 'a'
        is_correct: isCorrect,
      });
    }

    const percentage =
      totalAvailablePoints > 0
        ? Math.round((studentScore / totalAvailablePoints) * 100)
        : 0;

    const newSubmission: Submission = {
      id: submissionId,
      student_id: user.id,
      student_name: user.full_name,
      student_email: user.email,
      student_id_number: user.student_id || "N/A",
      room_id: roomId,
      score: studentScore,
      percentage,
      submitted_at: new Date().toISOString(),
      cheating_flags: parseInt(cheatingCount) || 0,
      violation_timestamps: Array.isArray(timestamps) ? timestamps : [],
    };

    db.addOrUpdateSubmission(newSubmission, generatedAnswers);
    res.status(201).json({ submission: newSubmission });
  },
);

// GET /api/submissions/:roomId - Fetch submissions reports for teacher
app.get(
  "/api/submissions/:roomId",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const subs = db
      .getSubmissions()
      .filter((s) => s.room_id === req.params.roomId);

    res.json({ submissions: subs });
  },
);

// GET /api/submissions/my-history - Fetch student's own testing record
app.get(
  "/api/submissions/my-history",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    if (user.role !== "student") {
      return res
        .status(400)
        .json({ error: "Only student login is applicable." });
    }

    const studentSubmissions = db
      .getSubmissions()
      .filter((s) => s.student_id === user.id);
    const enriched = studentSubmissions.map((sub) => {
      const r = db.getRooms().find((room) => room.id === sub.room_id);
      return {
        ...sub,
        room_title: r?.title || "Deleted Examination",
        room_subject: r?.subject || "Unknown",
      };
    });

    res.json({ submissions: enriched });
  },
);

// ----------------------------------------------------
// ANALYTICS & STATS ENGINE
// ----------------------------------------------------

app.get(
  "/api/analytics/room/:roomId",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    const roomId = req.params.roomId;

    const roomSubmissions = db
      .getSubmissions()
      .filter((s) => s.room_id === roomId);
    const roomQuestions = db.getQuestions().filter((q) => q.room_id === roomId);

    if (roomQuestions.length === 0) {
      return res.json({
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        submissionsCount: 0,
        questionStats: [],
      });
    }

    const count = roomSubmissions.length;
    if (count === 0) {
      return res.json({
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        submissionsCount: 0,
        questionStats: roomQuestions.map((q) => ({
          id: q.id,
          text: q.question_text,
          correctCount: 0,
          wrongCount: 0,
          failedRate: 0,
        })),
      });
    }

    const scores = roomSubmissions.map((s) => s.score);
    const percentages = roomSubmissions.map((s) => s.percentage);

    const averagePercentage = Math.round(
      percentages.reduce((a, b) => a + b, 0) / count,
    );
    const highestPercentage = Math.max(...percentages);
    const lowestPercentage = Math.min(...percentages);

    const passingThreshold = 50; // passing standard is 50%
    const passingCount = roomSubmissions.filter(
      (s) => s.percentage >= passingThreshold,
    ).length;
    const passRate = Math.round((passingCount / count) * 100);

    // Compute stats per question
    const answers = db.getAnswers();
    const questionStats = roomQuestions.map((q) => {
      const qAnswers = answers.filter((a) => a.question_id === q.id);
      const correctAnswers = qAnswers.filter((a) => a.is_correct).length;
      const wrongAnswers = qAnswers.length - correctAnswers;
      const failedRate =
        qAnswers.length > 0
          ? Math.round((wrongAnswers / qAnswers.length) * 100)
          : 0;

      return {
        id: q.id,
        text: q.question_text,
        correctCount: correctAnswers,
        wrongCount: wrongAnswers,
        failedRate,
      };
    });

    res.json({
      averagePercentage,
      highestPercentage,
      lowestPercentage,
      passRate,
      submissionsCount: count,
      questionStats,
    });
  },
);

// ----------------------------------------------------
// GEMINI INTELLIGENCE ASSIGNMENTS
// ----------------------------------------------------

// POST /api/ai/classroom-summary - Generate whole class analysis
app.post(
  "/api/ai/classroom-summary",
  authenticate,
  async (req: Request, res: Response) => {
    const { roomId } = req.body;

    const room = db.getRooms().find((r) => r.id === roomId);
    if (!room)
      return res.status(404).json({ error: "Testing room not found." });

    const submissions = db.getSubmissions().filter((s) => s.room_id === roomId);
    const questions = db.getQuestions().filter((q) => q.room_id === roomId);

    if (questions.length === 0) {
      return res.json({
        summary: "No questions assigned back to this platform test room.",
      });
    }

    const ai = getAi();
    if (!ai) {
      // Return mock response when API key is unassigned
      return res.json({
        summary: `**[DEMO CHANNELS ACTIVE - Setting up GEMINI_API_KEY in Secrets panel enables real-time LLM reasoning!]**\n\n### Overall Class Insights\nStudents executed the exam with an average score of **60%**. There is a visible gap between students who completed calculations correctly and those who failed applications.\n\n### Weakest Concepts Captured\n* **Advanced Multivariable Integration**: Students struggle with defining integration boundaries recursively.\n* **Limits of logarithmic expansions**: Emma Watson and other participants failed derivative logic due to missing derivative rule compositions.\n\n### Strongest Concepts Captured\n* **Planck Scale constants**: 100% accurate conceptual recall observed.\n* **Basics of coordinate Limits**: Very high pass rate regarding first principles.`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Perform professional educational analysis.
Class Test details:
Title: ${room.title}
Subject: ${room.subject}
Questions: ${JSON.stringify(questions.map((q) => ({ id: q.id, text: q.question_text, points: q.points })))}
Submissions details: ${JSON.stringify(submissions.map((s) => ({ name: s.student_name, score: s.score, percentage: s.percentage, cheating_violations: s.cheating_flags })))}

Provide insights in Markdown format matching:
1. Overall class performance summary.
2. Concept gaps identified (fail triggers, logic flaws observed).
3. Best performing modules.
4. Actionable learning improvements for the teacher.`,
      });

      if (!response || !response.text) {
        throw new Error("No response text returned from Gemini API");
      }

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error(
        "Gemini classroom summary failed, using fallback data",
        error,
      );
      // Graceful fallback when provided key has invalid credentials or quota limits
      res.json({
        summary: `**[SYSTEM ALERT - The provided GEMINI_API_KEY is invalid or expired. Running in intelligent fallback simulation mode]**\n\n### Overall Class Insights\nStudents completed the exam with a class average score of **60%**. There is a visible conceptual gap between students who completed the calculations correctly and those who failed first-principles applications.\n\n### Weakest Concepts Captured\n* **Advanced Multivariable Integration**: Students struggle with defining integration boundaries recursively.\n* **Limits of logarithmic expansions**: Emma Watson and other participants failed derivative logic due to missing derivative rule compositions.\n\n### Strongest Concepts Captured\n* **Planck Scale constants**: 100% accurate conceptual recall observed.\n* **Basics of coordinate Limits**: Very high pass rate regarding first principles.\n\n### Recommended Next Steps\n* Host a group workshop covering multivariable bounds calculation.\n* Set up homework focus sets for recursive limits.`,
      });
    }
  },
);

// Helper for local analytics responses when API key is unavailable or during fallback
function generateLocalAnalyticsReply(
  query: string,
  room: TestRoom,
  submissions: Submission[],
  questionStats: any[],
  avgScore: number,
  passRate: number,
  topScorer: Submission | null,
  lowestScorer: Submission | null,
  cheatingFlagged: Submission[],
): string {
  const q = query.toLowerCase();

  if (
    q.includes("overall") ||
    q.includes("summary") ||
    q.includes("diagnostic") ||
    q.includes("how did") ||
    q.includes("overview")
  ) {
    return `### 📊 Class Diagnostic Summary for "${room.title}"
    
- **Total Students Submitted:** **${submissions.length}**
- **Class Average Score:** **${avgScore}%**
- **Pass Rate:** **${passRate}%** (Threshold: 50%)
- **Top Performer:** ${topScorer ? `**${topScorer.student_name}** (${topScorer.percentage}%)` : "N/A"}
- **Lowest Performer:** ${lowestScorer ? `**${lowestScorer.student_name}** (${lowestScorer.percentage}%)` : "N/A"}
- **Proctoring Flagged:** **${cheatingFlagged.length}** student(s) with tab-switch/blur violations.

**Key Diagnostic Insight:** ${avgScore >= 70 ? "The overall class performance is strong with solid conceptual understanding." : "The class average indicates notable conceptual gaps. Focused re-teaching on weak areas is recommended."}`;
  }

  if (
    q.includes("help") ||
    q.includes("fail") ||
    q.includes("lowest") ||
    q.includes("struggl") ||
    q.includes("remediat")
  ) {
    const failedStudents = submissions.filter((s) => s.percentage < 50);
    if (failedStudents.length === 0) {
      return ` Great news! All **${submissions.length}** student(s) passed the exam threshold (≥50%). The lowest score was **${lowestScorer?.student_name}** at **${lowestScorer?.percentage}%**.`;
    }
    return `### ⚠️ Students Requiring Remediation / Assistance
The following **${failedStudents.length}** student(s) scored below the 50% passing threshold:

${failedStudents.map((s) => `- **${s.student_name}** (${s.student_id_number}): Score **${s.percentage}%** (${s.score} pts) | ${s.cheating_flags} proctoring flag(s)`).join("\n")}

**Action Plan:**
1. Schedule a 1-on-1 tutoring check-in with these students.
2. Review the most frequently missed question items.
3. Offer a supplementary retake or revision assignment.`;
  }

  if (
    q.includes("question") ||
    q.includes("missed") ||
    q.includes("hardest") ||
    q.includes("item") ||
    q.includes("wrong")
  ) {
    if (questionStats.length === 0)
      return "No questions are currently indexed for this exam room.";
    const sortedByFailure = [...questionStats].sort(
      (a, b) => b.failure_rate_percentage - a.failure_rate_percentage,
    );
    const hardest = sortedByFailure[0];
    return `### ❓ Question Failure Rate Analysis
The question with the **highest failure rate** in this exam is:

> **Q: "${hardest.question}"**
> - **Failure Rate:** **${hardest.failure_rate_percentage}%**
> - **Correct Answers:** ${hardest.correct_count} student(s)
> - **Wrong Answers:** ${hardest.wrong_count} student(s)
> - **Correct Key:** \`${hardest.correct_answer.toUpperCase()}\`

**Pedagogical Tip:** Over half the students missed this question. Consider reviewing this topic in your next lecture session.`;
  }

  if (
    q.includes("cheat") ||
    q.includes("proctor") ||
    q.includes("flag") ||
    q.includes("blur") ||
    q.includes("suspicio") ||
    q.includes("violat")
  ) {
    if (cheatingFlagged.length === 0) {
      return `🛡️ **Proctoring Status: ALL CLEAR.** No tab-switching, window blur, or proctoring violations were recorded across all **${submissions.length}** submission(s).`;
    }
    return `### 🛡️ Anti-Cheating & Proctoring Report
Tab-switch/blur violations were recorded for **${cheatingFlagged.length}** student(s):

${cheatingFlagged.map((s) => `- **${s.student_name}** (${s.student_email}): **${s.cheating_flags} flag(s)** detected during test window.`).join("\n")}

**Recommendation:** Review individual student timestamps or follow up directly regarding exam integrity rules.`;
  }

  if (
    q.includes("top") ||
    q.includes("best") ||
    q.includes("highest") ||
    q.includes("leader") ||
    q.includes("star")
  ) {
    const topScorers = [...submissions]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    return `### 🏆 Top Performing Students
The top scoring students in **"${room.title}"** are:

${topScorers.map((s, i) => `${i + 1}. **${s.student_name}** (${s.student_id_number}) — **${s.percentage}%** (${s.score} pts)`).join("\n")}`;
  }

  if (
    q.includes("homework") ||
    q.includes("lesson") ||
    q.includes("next") ||
    q.includes("plan") ||
    q.includes("suggest")
  ) {
    return `### 💡 Recommended Next Steps for "${room.title}"

Based on the class performance data:
1. **Targeted Review**: Spend 15 minutes reviewing the hardest question items (e.g. "${questionStats[0]?.question || "Key concepts"}").
2. **Support Group**: Provide peer-tutoring pairs between top scorers (${topScorer?.student_name || "Top students"}) and students needing support.
3. **Practice Quiz**: Deploy a 3-question review quiz on weaker topics before the next major unit assessment.`;
  }

  return `### 💡 Diagnostic Analysis for "${room.title}"

Regarding your inquiry: *"${query}"*

- **Class Size:** ${submissions.length} student(s)
- **Average Grade:** ${avgScore}% | **Pass Rate:** ${passRate}%
- **Top Performer:** ${topScorer ? `${topScorer.student_name} (${topScorer.percentage}%)` : "N/A"}
- **Proctoring Alerts:** ${cheatingFlagged.length} student(s) flagged

You can ask me specific questions like:
- *"Which students failed or need urgent help?"*
- *"Which question was hardest for the class?"*
- *"Show me anti-cheating proctoring flags"*
- *"Who are the top performers?"*
- *"Suggest a lesson plan for next week"*`;
}

// POST /api/ai/class-chat - Interactive AI chatbot for teachers
app.post(
  "/api/ai/class-chat",
  authenticate,
  async (req: Request, res: Response) => {
    const { roomId, message, history } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({ error: "Missing roomId or message." });
    }

    const room = db.getRooms().find((r) => r.id === roomId);
    if (!room)
      return res.status(404).json({ error: "Testing room not found." });

    const submissions = db.getSubmissions().filter((s) => s.room_id === roomId);
    const questions = db.getQuestions().filter((q) => q.room_id === roomId);
    const allAnswers = db.getAnswers();

    // Compute question stats
    const questionStats = questions.map((q) => {
      const qAnswers = allAnswers.filter((a) => a.question_id === q.id);
      const correctCount = qAnswers.filter((a) => a.is_correct).length;
      const wrongCount = qAnswers.length - correctCount;
      const failureRate =
        qAnswers.length > 0
          ? Math.round((wrongCount / qAnswers.length) * 100)
          : 0;
      return {
        question: q.question_text,
        correct_answer: q.correct_answer,
        points: q.points,
        correct_count: correctCount,
        wrong_count: wrongCount,
        failure_rate_percentage: failureRate,
      };
    });

    const totalStudents = submissions.length;
    const avgScore =
      totalStudents > 0
        ? Math.round(
            submissions.reduce((acc, s) => acc + s.percentage, 0) /
              totalStudents,
          )
        : 0;
    const passingStudents = submissions.filter((s) => s.percentage >= 50);
    const passRate =
      totalStudents > 0
        ? Math.round((passingStudents.length / totalStudents) * 100)
        : 0;
    const topScorer =
      submissions.length > 0
        ? [...submissions].sort((a, b) => b.percentage - a.percentage)[0]
        : null;
    const lowestScorer =
      submissions.length > 0
        ? [...submissions].sort((a, b) => a.percentage - b.percentage)[0]
        : null;
    const cheatingFlagged = submissions.filter((s) => s.cheating_flags > 0);

    const studentBreakdown = submissions.map((s) => ({
      name: s.student_name,
      email: s.student_email,
      id_number: s.student_id_number,
      score: s.score,
      percentage: `${s.percentage}%`,
      status: s.percentage >= 50 ? "PASSED" : "FAILED",
      proctoring_flags: s.cheating_flags,
      date: new Date(s.submitted_at).toLocaleDateString(),
    }));

    const systemInstruction = `You are an expert, empathetic AI Academic Analyst & Educational Consultant assisting teachers and professors on the examPaper platform.

EXAM CONTEXT FOR ROOM "${room.title}":
- Subject: ${room.subject}
- Time Allotted: ${room.time_limit} minutes
- Total Submissions: ${totalStudents}
- Class Average: ${avgScore}%
- Pass Rate: ${passRate}% (Threshold: 50%)
- Top Performer: ${topScorer ? `${topScorer.student_name} (${topScorer.percentage}%)` : "None"}
- Lowest Performer: ${lowestScorer ? `${lowestScorer.student_name} (${lowestScorer.percentage}%)` : "None"}
- Proctoring/Cheating Violations Flagged: ${cheatingFlagged.length} student(s)

DETAILED QUESTION STATS:
${JSON.stringify(questionStats, null, 2)}

STUDENT RESULTS BREAKDOWN:
${JSON.stringify(studentBreakdown, null, 2)}

YOUR ROLE & INSTRUCTIONS:
1. Answer the teacher's query accurately using the real data provided above.
2. If asked about a specific student, look up their score, percentage, proctoring flags, and performance.
3. If asked about hardest/easiest questions, refer to failure rates and correct/wrong counts.
4. If asked for pedagogical advice or next steps, provide structured, clear bullet points with practical classroom strategies.
5. Keep your tone professional, encouraging, and data-driven. Use Markdown formatting (bolding, bullet points, headers, tables when useful).`;

    const ai = getAi();

    if (!ai) {
      let smartReply = generateLocalAnalyticsReply(
        message,
        room,
        submissions,
        questionStats,
        avgScore,
        passRate,
        topScorer,
        lowestScorer,
        cheatingFlagged,
      );
      return res.json({ reply: smartReply });
    }

    try {
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history) {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText =
        response.text ||
        "I was unable to analyze this query. Please try rephrasing your question.";
      res.json({ reply: replyText });
    } catch (err: any) {
      console.error(
        "Gemini class-chat failed, using local smart response fallback:",
        err,
      );
      let smartReply = generateLocalAnalyticsReply(
        message,
        room,
        submissions,
        questionStats,
        avgScore,
        passRate,
        topScorer,
        lowestScorer,
        cheatingFlagged,
      );
      res.json({ reply: smartReply });
    }
  },
);

// POST /api/ai/student-insights - Personalized learning report
app.post(
  "/api/ai/student-insights",
  authenticate,
  async (req: Request, res: Response) => {
    const { submissionId } = req.body;

    const sub = db.getSubmissions().find((s) => s.id === submissionId);
    if (!sub)
      return res
        .status(404)
        .json({ error: "Exam submission record not found." });

    const room = db.getRooms().find((r) => r.id === sub.room_id);
    const questions = db
      .getQuestions()
      .filter((q) => q.room_id === sub.room_id);
    const studentAnswers = db
      .getAnswers()
      .filter((a) => a.submission_id === sub.id);

    const cleanAnswers = studentAnswers.map((ans) => {
      const q = questions.find((question) => question.id === ans.question_id);
      return {
        question_text: q?.question_text || "Unknown Question",
        selected_answer: ans.selected_answer,
        is_correct: ans.is_correct,
      };
    });

    const ai = getAi();
    if (!ai) {
      return res.json({
        insight: `**[DEMO ACTIVE - Setup GEMINI_API_KEY for dynamic student tutoring pathing]**\n\n### Hi ${sub.student_name},\nHere is your custom tutoring diagnostic:\n\n* **Core Strength**: Highly accurate on basic theorems and coordinate mapping. Your memory recall is quick and responsive.\n* **Constructive Improvement Zone**: Your derivative chain rule calculations failed. Repeated incorrect options on algebraic derivatives indicate a need to practice nested limits.\n* **Custom Study Outline**: Re-watch tutorial animations on 'Logarithmic and Chain Rule Combinations' and attempt 5 practice examples in index bounds.`,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide actionable academic feedback to student regarding their exam submission.
Student: ${sub.student_name}
Exam Title: ${room?.title || "Test"}
Score: ${sub.score} / ${sub.percentage}%
Selected responses: ${JSON.stringify(cleanAnswers)}

Format the feedback nicely in Markdown:
1. Encouraging greetings and diagnostic score explanation.
2. Strengths detected.
3. specific concepts or weak points to focus on.
4. Tailored recommendations, study logs, and homework steps.`,
      });

      if (!response || !response.text) {
        throw new Error("No response text returned from Gemini API");
      }

      res.json({ insight: response.text });
    } catch (e: any) {
      console.error("Gemini student insights failed, using fallback data", e);
      // Graceful fallback when API key is invalid/expired
      res.json({
        insight: `**[SYSTEM ALERT - The provided GEMINI_API_KEY is invalid or expired. Running in diagnostic fallback simulation mode]**\n\n### Hi ${sub.student_name},\nHere is your personalized academic diagnostic based on your submission:\n\n* **Core Strength**: You showed highly accurate knowledge on theoretical first principles and formula application. Your score is **${sub.percentage}%**.\n* **Key Opportunity Zone**: There are missed steps in complex calculation rules. Ensure you double-check multivariable boundaries.\n* **Actionable Tutoring Route**: Spend 20 minutes reviewing coordinate transforms and solve the supplementary unit exercises.`,
      });
    }
  },
);

// POST /api/ai/generate-questions - Intelligent MCQ Question creation
app.post(
  "/api/ai/generate-questions",
  authenticate,
  async (req: Request, res: Response) => {
    const { prompt, count } = req.body;
    if (!prompt) {
      return res
        .status(400)
        .json({ error: "Generation prompt instructions are required." });
    }

    const volume = parseInt(count) || 5;

    const ai = getAi();
    if (!ai) {
      // Generate lovely sample questions instantly so teachers can test without key!
      const mockQs = [];
      for (let i = 1; i <= volume; i++) {
        mockQs.push({
          id: `q_ai_mock_${Date.now()}_${i}`,
          question_text: `AI Mock Question ${i}: Related to: [${prompt}]. Which principle best applies here?`,
          option_a: "Option A is correct based on the primary theorem.",
          option_b: "Option B defines the secondary thermodynamic boundary.",
          option_c: "Option C is an erroneous mathematical artifact.",
          option_d: "Option D represents a standard control condition.",
          correct_answer: "a",
          points: 10,
        });
      }
      return res.json({ questions: mockQs });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate exactly ${volume} high-quality Multiple Choice Questions (MCQs) regarding: "${prompt}". Each question must have exactly 4 choices (labeled 'a', 'b', 'c', 'd') and a single correct answer. Provide clear and balanced answers.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: {
                  type: Type.STRING,
                  description: "The conceptual question stem.",
                },
                option_a: {
                  type: Type.STRING,
                  description: "First multiple choice option.",
                },
                option_b: {
                  type: Type.STRING,
                  description: "Second multiple choice option.",
                },
                option_c: {
                  type: Type.STRING,
                  description: "Third multiple choice option.",
                },
                option_d: {
                  type: Type.STRING,
                  description: "Fourth multiple choice option.",
                },
                correct_answer: {
                  type: Type.STRING,
                  description:
                    "Exactly 'a' or 'b' or 'c' or 'd' corresponding to the true solution.",
                },
                points: {
                  type: Type.INTEGER,
                  description: "Points allocated (suggest 10, 15, or 20).",
                },
              },
              required: [
                "question_text",
                "option_a",
                "option_b",
                "option_c",
                "option_d",
                "correct_answer",
                "points",
              ],
            },
          },
        },
      });

      if (!response || !response.text) {
        throw new Error("No response text returned from Gemini API");
      }

      const parsedQs = JSON.parse(response.text.trim());
      res.json({ questions: parsedQs });
    } catch (err: any) {
      console.error(
        "Gemini MCQ generation failed, utilizing fallback MCQ generator",
        err,
      );

      // Generate beautiful topic-aware fallback questions instead of returning a 500 error
      const topic = prompt || "Academic Topic";
      const volume = parseInt(count) || 5;
      const mockQs = [];

      for (let i = 1; i <= volume; i++) {
        mockQs.push({
          id: `q_ai_fallback_${Date.now()}_${i}`,
          question_text: `Challenge Question ${i}: Related to: [${topic}]. Which statement best describes the fundamental principle?`,
          option_a:
            "Option A represents the primary established scientific consensus.",
          option_b:
            "Option B is an alternative hypothetical thermodynamic model.",
          option_c: "Option C contains an erroneous mathematical transform.",
          option_d:
            "Option D is a control outcome showing no interactive response.",
          correct_answer: "a",
          points: 10,
        });
      }

      res.json({
        questions: mockQs,
        warning:
          "Note: The provided GEMINI_API_KEY is invalid/expired. Active fallback simulator responded.",
      });
    }
  },
);

// 26. ADMIN CONTROLS API
app.get("/api/admin/users", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Full administrator privileges required." });
  }
  res.json({ users: db.getUsers() });
});

app.post(
  "/api/admin/users/:id/status",
  authenticate,
  (req: Request, res: Response) => {
    const user = (req as any).user as User;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { status } = req.body;
    if (status !== "active" && status !== "banned") {
      return res.status(400).json({ error: "Invalid status state." });
    }

    db.updateUser(req.params.id, { status });
    res.json({ success: true, status });
  },
);

app.get("/api/admin/analytics", authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Access denied." });
  }

  const allUsers = db.getUsers();
  const rooms = db.getRooms();
  const submissions = db.getSubmissions();

  res.json({
    totalUsersCount: allUsers.length,
    studentsCount: allUsers.filter((u) => u.role === "student").length,
    teachersCount: allUsers.filter((u) => u.role === "teacher").length,
    roomsCount: rooms.length,
    submissionsCount: submissions.length,
    avgPassingRate: Math.round(
      (submissions.filter((s) => s.percentage >= 50).length /
        (submissions.length || 1)) *
        100,
    ),
  });
});

// ----------------------------------------------------
// VITE DEV SERVER OR STATIC SERVING MIDDLEWARE
// ----------------------------------------------------
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Quant Server] Running securely on port ${PORT}`);
  });
}

startAppServer();
