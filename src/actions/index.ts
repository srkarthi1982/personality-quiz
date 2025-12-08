import type { ActionAPIContext } from "astro:actions";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import {
  and,
  db,
  eq,
  inArray,
  PersonalityOptions,
  PersonalityQuestions,
  PersonalityQuizResults,
  PersonalityQuizzes,
  PersonalityTypes,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getOwnedQuizOrThrow(quizId: string, userId: string) {
  const [quiz] = await db
    .select()
    .from(PersonalityQuizzes)
    .where(eq(PersonalityQuizzes.id, quizId));

  if (!quiz) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Quiz not found.",
    });
  }

  if (quiz.userId !== userId) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access to this quiz.",
    });
  }

  return quiz;
}

async function getAccessibleQuizOrThrow(quizId: string, userId: string) {
  const [quiz] = await db
    .select()
    .from(PersonalityQuizzes)
    .where(eq(PersonalityQuizzes.id, quizId));

  if (!quiz) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Quiz not found.",
    });
  }

  if (!(quiz.isSystem || quiz.userId === userId)) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access to this quiz.",
    });
  }

  return quiz;
}

export const server = {
  createQuiz: defineAction({
    input: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      language: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const quizId = crypto.randomUUID();

      await db.insert(PersonalityQuizzes).values({
        id: quizId,
        userId: user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        language: input.language,
        isSystem: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        data: { id: quizId },
      };
    },
  }),

  updateQuiz: defineAction({
    input: z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      language: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getOwnedQuizOrThrow(input.id, user.id);

      await db
        .update(PersonalityQuizzes)
        .set({
          title: input.title,
          description: input.description,
          category: input.category,
          language: input.language,
          isActive: input.isActive ?? quiz.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(PersonalityQuizzes.id, input.id), eq(PersonalityQuizzes.userId, user.id)));

      return {
        success: true,
      };
    },
  }),

  archiveQuiz: defineAction({
    input: z.object({ id: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedQuizOrThrow(input.id, user.id);

      await db
        .update(PersonalityQuizzes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(PersonalityQuizzes.id, input.id), eq(PersonalityQuizzes.userId, user.id)));

      return {
        success: true,
      };
    },
  }),

  listMyQuizzes: defineAction({
    input: z.object({ includeInactive: z.boolean().default(false) }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const query = db
        .select()
        .from(PersonalityQuizzes)
        .where(eq(PersonalityQuizzes.userId, user.id));

      const quizzes = await query;
      const filtered = input.includeInactive
        ? quizzes
        : quizzes.filter((quiz) => quiz.isActive);

      return {
        success: true,
        data: {
          items: filtered,
          total: filtered.length,
        },
      };
    },
  }),

  getQuizWithDetails: defineAction({
    input: z.object({ quizId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getAccessibleQuizOrThrow(input.quizId, user.id);

      const types = await db
        .select()
        .from(PersonalityTypes)
        .where(eq(PersonalityTypes.quizId, quiz.id));

      const questions = await db
        .select()
        .from(PersonalityQuestions)
        .where(eq(PersonalityQuestions.quizId, quiz.id));

      const questionIds = questions.map((q) => q.id);
      const options = questionIds.length
        ? await db
            .select()
            .from(PersonalityOptions)
            .where(inArray(PersonalityOptions.questionId, questionIds))
        : [];

      const optionsByQuestion = questionIds.reduce<
        Record<string, (typeof options)[number][]>
      >(function (acc, id) {
        acc[id] = [];
        return acc;
      }, {});

      for (const option of options) {
        const list = optionsByQuestion[option.questionId];
        if (list) {
          list.push(option);
        }
      }

      const questionsWithOptions = questions.map((question) => ({
        ...question,
        options: optionsByQuestion[question.id] ?? [],
      }));

      return {
        success: true,
        data: {
          quiz,
          types,
          questions: questionsWithOptions,
        },
      };
    },
  }),

  upsertPersonalityType: defineAction({
    input: z.object({
      id: z.string().optional(),
      quizId: z.string().min(1),
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getOwnedQuizOrThrow(input.quizId, user.id);

      if (input.id) {
        const [type] = await db
          .select()
          .from(PersonalityTypes)
          .where(eq(PersonalityTypes.id, input.id));

        if (!type || type.quizId !== quiz.id) {
          throw new ActionError({ code: "FORBIDDEN", message: "Type not found for this quiz." });
        }

        await db
          .update(PersonalityTypes)
          .set({
            code: input.code,
            name: input.name,
            description: input.description,
          })
          .where(eq(PersonalityTypes.id, input.id));

        return { success: true, data: { id: input.id } };
      }

      const id = crypto.randomUUID();

      await db.insert(PersonalityTypes).values({
        id,
        quizId: quiz.id,
        code: input.code,
        name: input.name,
        description: input.description,
        createdAt: new Date(),
      });

      return { success: true, data: { id } };
    },
  }),

  deletePersonalityType: defineAction({
    input: z.object({ id: z.string().min(1), quizId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getOwnedQuizOrThrow(input.quizId, user.id);

      const [type] = await db
        .select()
        .from(PersonalityTypes)
        .where(eq(PersonalityTypes.id, input.id));

      if (!type || type.quizId !== quiz.id) {
        throw new ActionError({ code: "NOT_FOUND", message: "Type not found." });
      }

      await db.delete(PersonalityTypes).where(eq(PersonalityTypes.id, input.id));

      return { success: true };
    },
  }),

  upsertQuestion: defineAction({
    input: z.object({
      id: z.string().optional(),
      quizId: z.string().min(1),
      orderIndex: z.number().int().nonnegative(),
      questionText: z.string().min(1),
      helpText: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getOwnedQuizOrThrow(input.quizId, user.id);

      if (input.id) {
        const [question] = await db
          .select()
          .from(PersonalityQuestions)
          .where(eq(PersonalityQuestions.id, input.id));

        if (!question || question.quizId !== quiz.id) {
          throw new ActionError({ code: "FORBIDDEN", message: "Question not found for this quiz." });
        }

        await db
          .update(PersonalityQuestions)
          .set({
            orderIndex: input.orderIndex,
            questionText: input.questionText,
            helpText: input.helpText,
          })
          .where(eq(PersonalityQuestions.id, input.id));

        return { success: true, data: { id: input.id } };
      }

      const id = crypto.randomUUID();

      await db.insert(PersonalityQuestions).values({
        id,
        quizId: quiz.id,
        orderIndex: input.orderIndex,
        questionText: input.questionText,
        helpText: input.helpText,
        createdAt: new Date(),
      });

      return { success: true, data: { id } };
    },
  }),

  deleteQuestion: defineAction({
    input: z.object({ id: z.string().min(1), quizId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getOwnedQuizOrThrow(input.quizId, user.id);

      const [question] = await db
        .select()
        .from(PersonalityQuestions)
        .where(eq(PersonalityQuestions.id, input.id));

      if (!question || question.quizId !== quiz.id) {
        throw new ActionError({ code: "NOT_FOUND", message: "Question not found." });
      }

      await db.delete(PersonalityQuestions).where(eq(PersonalityQuestions.id, input.id));
      await db.delete(PersonalityOptions).where(eq(PersonalityOptions.questionId, input.id));

      return { success: true };
    },
  }),

  upsertOption: defineAction({
    input: z.object({
      id: z.string().optional(),
      questionId: z.string().min(1),
      orderIndex: z.number().int().nonnegative(),
      optionText: z.string().min(1),
      typeScores: z.record(z.string(), z.number()).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [question] = await db
        .select()
        .from(PersonalityQuestions)
        .where(eq(PersonalityQuestions.id, input.questionId));

      if (!question) {
        throw new ActionError({ code: "NOT_FOUND", message: "Question not found." });
      }

      await getOwnedQuizOrThrow(question.quizId, user.id);

      const payload = {
        orderIndex: input.orderIndex,
        optionText: input.optionText,
        typeScoresJson: input.typeScores
          ? JSON.stringify(input.typeScores)
          : undefined,
      };

      if (input.id) {
        const [existing] = await db
          .select()
          .from(PersonalityOptions)
          .where(eq(PersonalityOptions.id, input.id));

        if (!existing || existing.questionId !== question.id) {
          throw new ActionError({ code: "FORBIDDEN", message: "Option not found for this question." });
        }

        await db
          .update(PersonalityOptions)
          .set(payload)
          .where(eq(PersonalityOptions.id, input.id));

        return { success: true, data: { id: input.id } };
      }

      const id = crypto.randomUUID();

      await db.insert(PersonalityOptions).values({
        id,
        questionId: question.id,
        ...payload,
        createdAt: new Date(),
      });

      return { success: true, data: { id } };
    },
  }),

  deleteOption: defineAction({
    input: z.object({ id: z.string().min(1), questionId: z.string().min(1) }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [question] = await db
        .select()
        .from(PersonalityQuestions)
        .where(eq(PersonalityQuestions.id, input.questionId));

      if (!question) {
        throw new ActionError({ code: "NOT_FOUND", message: "Question not found." });
      }

      await getOwnedQuizOrThrow(question.quizId, user.id);

      const [option] = await db
        .select()
        .from(PersonalityOptions)
        .where(eq(PersonalityOptions.id, input.id));

      if (!option || option.questionId !== question.id) {
        throw new ActionError({ code: "NOT_FOUND", message: "Option not found." });
      }

      await db.delete(PersonalityOptions).where(eq(PersonalityOptions.id, input.id));

      return { success: true };
    },
  }),

  recordQuizResult: defineAction({
    input: z.object({
      quizId: z.string().min(1),
      dominantTypeId: z.string().optional(),
      resultSummary: z.string().optional(),
      scores: z.record(z.string(), z.number()).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const quiz = await getAccessibleQuizOrThrow(input.quizId, user.id);

      if (input.dominantTypeId) {
        const [type] = await db
          .select()
          .from(PersonalityTypes)
          .where(eq(PersonalityTypes.id, input.dominantTypeId));

        if (!type || type.quizId !== quiz.id) {
          throw new ActionError({ code: "BAD_REQUEST", message: "Dominant type does not belong to quiz." });
        }
      }

      const id = crypto.randomUUID();

      await db.insert(PersonalityQuizResults).values({
        id,
        quizId: quiz.id,
        userId: user.id,
        dominantTypeId: input.dominantTypeId,
        resultSummary: input.resultSummary,
        scoresJson: input.scores ? JSON.stringify(input.scores) : undefined,
        createdAt: new Date(),
      });

      return { success: true, data: { id } };
    },
  }),
};
