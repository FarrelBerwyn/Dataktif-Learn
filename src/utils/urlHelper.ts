import { Course, Lesson } from '../types';

/**
 * Generate a clean URL-friendly slug from text.
 * Strips special characters, trims whitespace, and converts spaces to dashes.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates the clean route path for a given course and lesson:
 * e.g. "/nama_course/video_course" -> "/ai-automation-masterclass/intro-to-prompt-engineering"
 */
export function generateLessonPath(course: Course, lesson: Lesson): string {
  const courseSlug = slugify(course.name || course.title || course.id);
  const lessonSlug = slugify(lesson.title || lesson.filename || lesson.id);
  return `/${courseSlug}/${lessonSlug}`;
}

/**
 * Parses pathname (e.g. "/ai-masterclass/intro-to-llm") into courseSlug and videoSlug.
 * Returns null if not a 2-segment course-video path.
 */
export function parseLessonPath(pathname: string): { courseSlug: string; videoSlug: string } | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return {
      courseSlug: segments[0],
      videoSlug: segments[1],
    };
  }
  return null;
}

/**
 * Finds a matching course and lesson in the course list by comparing slugs or IDs.
 */
export function matchCourseAndLesson(
  courses: Course[],
  courseSlug: string,
  videoSlug: string
): { course: Course; lesson: Lesson } | null {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedVideoSlug = slugify(videoSlug);

  // 1. Find course
  const course = courses.find((c) => {
    return (
      slugify(c.title) === normalizedCourseSlug ||
      slugify(c.name) === normalizedCourseSlug ||
      slugify(c.id) === normalizedCourseSlug ||
      c.id.toLowerCase() === courseSlug.toLowerCase()
    );
  });

  if (!course) return null;

  // 2. Find lesson within course
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

  const lesson = allLessons.find((l) => {
    return (
      slugify(l.title) === normalizedVideoSlug ||
      slugify(l.filename) === normalizedVideoSlug ||
      slugify(l.id) === normalizedVideoSlug ||
      l.id.toLowerCase() === videoSlug.toLowerCase()
    );
  });

  if (!lesson) {
    // If lesson slug doesn't match exactly, fallback to first lesson of this course
    if (allLessons.length > 0) {
      return { course, lesson: allLessons[0] };
    }
    return null;
  }

  return { course, lesson };
}
