import { test, expect, type Page } from "@playwright/test";
import { collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome } from "../fixtures/ui-helpers";

type Cell = { x: number; y: number };
type BoardState = {
  cellPx: number;
  cols: number;
  rows: number;
  head: Cell;
  tokens: Array<Cell & { text: string }>;
  walls: Cell[];
};

function keyForCell(cell: Cell) {
  return `${cell.x},${cell.y}`;
}

function nextCell(cell: Cell, dir: string): Cell {
  if (dir === "up") return { x: cell.x, y: cell.y - 1 };
  if (dir === "down") return { x: cell.x, y: cell.y + 1 };
  if (dir === "left") return { x: cell.x - 1, y: cell.y };
  return { x: cell.x + 1, y: cell.y };
}

function shortestPathToAnyToken(state: BoardState): string[] {
  const wallSet = new Set(state.walls.map(keyForCell));
  const targetSet = new Set(state.tokens.map(keyForCell));
  const queue: Array<{ cell: Cell; path: string[] }> = [{ cell: state.head, path: [] }];
  const seen = new Set([keyForCell(state.head)]);
  const dirs = ["up", "right", "down", "left"];

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    if (current.path.length > 0 && targetSet.has(keyForCell(current.cell))) {
      return current.path;
    }
    for (const dir of dirs) {
      const next = nextCell(current.cell, dir);
      const key = keyForCell(next);
      if (next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows) continue;
      if (wallSet.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push({ cell: next, path: [...current.path, dir] });
    }
  }

  throw new Error("Could not find a path from the player to any token");
}

async function getBoardState(page: Page): Promise<BoardState> {
  return page.evaluate(() => {
    function readCell(node: Element | null) {
      const element = node as HTMLElement | null;
      if (!element) return null;
      const transform = element.style.transform || "";
      const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
      if (!match) return null;
      const width = parseFloat(element.style.width || getComputedStyle(element).width || "0");
      const cellPx = width || 1;
      return {
        x: Math.round(parseFloat(match[1]) / cellPx),
        y: Math.round(parseFloat(match[2]) / cellPx),
        cellPx,
      };
    }

    const board = document.querySelector(".arc-board") as HTMLElement | null;
    const headNode = document.querySelector(".arc-seg--head");
    const head = readCell(headNode);
    if (!board || !head) {
      throw new Error("Arcade board/head not ready");
    }

    const tokens = [...document.querySelectorAll(".arc-token")].map((node) => {
      const cell = readCell(node);
      const text = (node.querySelector(".arc-token-text")?.textContent || "").trim();
      if (!cell) throw new Error("Token cell not readable");
      return { x: cell.x, y: cell.y, text };
    });

    const walls = [...document.querySelectorAll(".arc-border-cell, .arc-wall")].map((node) => {
      const cell = readCell(node);
      if (!cell) throw new Error("Wall cell not readable");
      return { x: cell.x, y: cell.y };
    });

    const cols = Math.round(parseFloat(board.style.width || "0") / head.cellPx);
    const rows = Math.round(parseFloat(board.style.height || "0") / head.cellPx);

    return {
      cellPx: head.cellPx,
      cols,
      rows,
      head: { x: head.x, y: head.y },
      tokens,
      walls,
    };
  });
}

async function pressArcadeDirection(page: Page, dir: string) {
  const overlay = page.getByTestId(`arcade-dpad-overlay-${dir}`);
  if (await overlay.isVisible()) {
    await overlay.click();
    return;
  }
  await page.getByTestId(`arcade-dpad-below-${dir}`).click();
}

async function driveIntoNearestTokenAndAssertStop(page: Page) {
  const initial = await getBoardState(page);
  const path = shortestPathToAnyToken(initial);
  expect(path.length).toBeGreaterThan(0);

  let current = initial.head;
  for (const dir of path) {
    current = nextCell(current, dir);
    await pressArcadeDirection(page, dir);
    await page.waitForFunction(
      ([x, y]) => {
        const head = document.querySelector(".arc-seg--head") as HTMLElement | null;
        if (!head) return false;
        const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(head.style.transform || "");
        const width = parseFloat(head.style.width || getComputedStyle(head).width || "0");
        if (!match || !width) return false;
        const headX = Math.round(parseFloat(match[1]) / width);
        const headY = Math.round(parseFloat(match[2]) / width);
        return headX === x && headY === y;
      },
      [current.x, current.y],
      { timeout: 1500, polling: "raf" },
    );
    await page.waitForTimeout(20);
  }

  const afterHit = await getBoardState(page);
  const stoppedAt = `${afterHit.head.x},${afterHit.head.y}`;

  await page.waitForTimeout(900);
  await expect
    .poll(async () => {
      const state = await getBoardState(page);
      return `${state.head.x},${state.head.y}`;
    }, { timeout: 1500 })
    .toBe(stoppedAt);
}

test("quiz hunt stops moving after the fox eats a token", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "arcade");
  await page.getByTestId("arcade-start-button").click();
  await expect(page.locator(".arc-board")).toBeVisible();

  await driveIntoNearestTokenAndAssertStop(page);
  await expectNoConsoleErrors(errors);
});

test("sentence snake stops moving after the player eats a token", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "arcade");
  await page.getByRole("button", { name: /Sentence Snake/i }).click();
  await page.getByTestId("arcade-start-button").click();
  await expect(page.locator(".arc-board")).toBeVisible();

  await driveIntoNearestTokenAndAssertStop(page);
  await expectNoConsoleErrors(errors);
});
