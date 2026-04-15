/**
 * Расширяет типы express-session: добавляет в SessionData поля,
 * которые мы кладём в сессию (например userId), чтобы TypeScript
 * знал о них при обращении к req.session.
 */
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
