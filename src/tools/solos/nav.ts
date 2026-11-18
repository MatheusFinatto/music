"use client";
// A tela atual de "Como solar no violão e na guitarra", ligada ao endereço do navegador: o "voltar" funciona, uma lição
// tem link próprio e recarregar a página não perde a posição na sessão (guardada no sessionStorage).
import { useSyncExternalStore } from "react";
import { curriculum } from "./curriculum/pt-BR";
import { progressStore } from "./progress";
import { buildSession, findExercise, toDay } from "./session/schedule";
import { decodeView, encodeView, findLesson, hrefOf, isAgain, lessonSteps, parseRoute, routeOf, sessionSteps, type View } from "./session/route";

const KEY = "musica:solos:tela";
const HOME: View = { name: "home" };

/** A tela atual e o endereço a que ela corresponde. */
let current: { href: string; view: View } | null = null;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

function saved(href: string): View | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as { href?: string; view?: string }) : null;
    return s?.href === href && s.view ? decodeView(curriculum, s.view) : null;
  } catch {
    return null;
  }
}

/** A tela de um endereço: a guardada, se for dele; senão, uma nova. Endereço inválido cai na trilha. */
function resolve(href: string): View {
  const kept = saved(href);
  if (kept) return kept;
  const route = parseRoute(href);
  const progress = progressStore.get();
  if (route.kind === "exercise") {
    const ex = findExercise(curriculum, route.id);
    return ex ? { name: "free", ex } : HOME;
  }
  if (route.kind === "lesson") {
    const lesson = findLesson(curriculum, route.id);
    return lesson ? { name: "session", lesson: lesson.id, steps: lessonSteps(lesson, isAgain(lesson, progress)), at: 0, ratings: [] } : HOME;
  }
  if (route.kind === "session") {
    const steps = sessionSteps(buildSession(curriculum, progress, toDay(new Date())), progress);
    return steps.length ? { name: "session", steps, at: 0, ratings: [] } : HOME;
  }
  return HOME;
}

// Compara com o endereço a cada leitura: quem sai para outra página do site por um link e volta
// para /solos não pode reencontrar a tela antiga com o endereço novo.
function get(): View {
  const href = window.location.search;
  if (current?.href !== href) current = { href, view: resolve(href) };
  return current.view;
}

const onPop = () => notify();

function subscribe(fn: () => void) {
  if (subs.size === 0) window.addEventListener("popstate", onPop);
  subs.add(fn);
  return () => {
    subs.delete(fn);
    if (subs.size === 0) window.removeEventListener("popstate", onPop);
  };
}

/** Vai para outra tela. `replace`: atualiza a entrada atual do histórico (passo dentro da mesma sessão). */
export function navigate(next: View, { replace = false } = {}) {
  const href = hrefOf(routeOf(next));
  const url = window.location.pathname + href;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  const encoded = encodeView(next);
  try {
    if (encoded) window.sessionStorage.setItem(KEY, JSON.stringify({ href, view: encoded }));
  } catch { /* sessionStorage bloqueado: só não guarda a posição */ }
  current = { href, view: next };
  notify();
}

export const useView = (): View => useSyncExternalStore(subscribe, get, () => HOME);
