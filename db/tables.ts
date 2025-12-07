/**
 * Personality Quiz - quizzes that map answers to personality types.
 *
 * Design goals:
 * - Quizzes with result types (e.g. Type A/B/C).
 * - Questions with options that map to one or more result types.
 * - Results per user for history.
 */

import { defineTable, column, NOW } from "astro:db";

export const PersonalityQuizzes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ optional: true }),          // null for system quizzes

    title: column.text(),                             // "Which learning style are you?"
    description: column.text({ optional: true }),
    category: column.text({ optional: true }),        // "career", "fun", "relationships"
    language: column.text({ optional: true }),

    isSystem: column.boolean({ default: false }),
    isActive: column.boolean({ default: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const PersonalityTypes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    quizId: column.text({
      references: () => PersonalityQuizzes.columns.id,
    }),

    code: column.text(),                              // "A", "B", "C", or "INTROVERT", etc.
    name: column.text(),                              // "The Strategist", "The Dreamer"
    description: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const PersonalityQuestions = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    quizId: column.text({
      references: () => PersonalityQuizzes.columns.id,
    }),

    orderIndex: column.number(),
    questionText: column.text(),
    helpText: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const PersonalityOptions = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    questionId: column.text({
      references: () => PersonalityQuestions.columns.id,
    }),

    orderIndex: column.number(),
    optionText: column.text(),

    // simple scoring model: JSON map of typeId -> score
    typeScoresJson: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

export const PersonalityQuizResults = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    quizId: column.text({
      references: () => PersonalityQuizzes.columns.id,
    }),
    userId: column.text({ optional: true }),

    dominantTypeId: column.text({
      references: () => PersonalityTypes.columns.id,
      optional: true,
    }),
    resultSummary: column.text({ optional: true }),   // explanation shown to user

    scoresJson: column.text({ optional: true }),      // full type score breakdown
    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  PersonalityQuizzes,
  PersonalityTypes,
  PersonalityQuestions,
  PersonalityOptions,
  PersonalityQuizResults,
} as const;
