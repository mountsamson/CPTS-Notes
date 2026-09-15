# CarlOS 98 — A Beginner's Guide to the Code

  

This document explains, in plain language, what every file in this project does and

*why* it's written the way it is. It's written for someone who knows computers well

(you've got 3 years as an IT technician) but is new to C++ and to how GUI programs /

"operating systems" are actually built in code.

  

You don't need to read this top to bottom in one sitting. Keep it open next to the

actual source files and jump to whichever section matches what you're looking at.

  

**A quick honest note before we dive in:** what's described below is a desktop/GUI

simulator — a window manager, drawing routines, a text editor, a paint program, a

game, a calculator. It doesn't contain or teach any of the things that actually make

software "malware" (process injection, persistence, credential theft, command-and-

control communication, antivirus evasion, and so on). If you're heading toward a

security career — malware analysis, reverse engineering, detection engineering, CTFs,

authorized red-team work — that's a solid path and I'm glad to help you build the

fundamentals for it. I just won't help build actual malicious tooling (real

backdoors, spyware, ransomware) without a clear legitimate context, like an

authorized pentest engagement, a CTF, or defensive research. Tell me more about which

side of security you're aiming for and I can point you at a much better learning path

than "write malware."

  

---

  

## Table of contents

  

1. [Words you'll keep seeing](#1-words-youll-keep-seeing)

2. [The big picture — how the pieces fit together](#2-the-big-picture)

3. [`src/os.h` — the rulebook](#3-srcosh--the-rulebook)

4. [`src/font8x8.h` — the alphabet stamp set](#4-srcfont8x8h--the-alphabet-stamp-set)

5. [`src/gfx.h` / `src/gfx.cpp` — the art supplies](#5-srcgfxh--srcgfxcpp--the-art-supplies)

6. [`src/desktop.h` / `src/desktop.cpp` — the office manager](#6-srcdesktoph--srcdesktopcpp--the-office-manager)

7. [`src/apps_main.cpp` — filesystem, Notepad, DOS prompt, dialogs](#7-srcapps_maincpp--filesystem-notepad-dos-prompt-dialogs)

8. [`src/apps_extra.cpp` — Minesweeper, Paint, Calculator, Explorer](#8-srcapps_extracpp--minesweeper-paint-calculator-explorer)

9. [`src/main.cpp` — the ignition switch](#9-srcmaincpp--the-ignition-switch)

10. [`CMakeLists.txt` / `build.sh` — turning text into a program](#10-cmakeliststxt--buildsh--turning-text-into-a-program)

11. [How one single frame gets drawn, start to finish](#11-how-one-single-frame-gets-drawn-start-to-finish)

12. [C++ concepts, mapped to real lines in this project](#12-c-concepts-mapped-to-real-lines-in-this-project)

13. [Where to go next](#13-where-to-go-next)

  

---

  

## 1. Words you'll keep seeing

  

Skim this once, then come back whenever a term trips you up.

  

- **Header file (`.h`) vs. source file (`.cpp`)** — A `.h` file is a *table of

contents*: "here's what exists, here's its name and shape." A `.cpp` file is the

*actual instructions*: "here's how it works, step by step." Splitting them apart

means one file can use something from another file without needing to see (or

recompile) all of its internal details. [os.h](src/os.h) is pure table-of-contents;

[gfx.cpp](src/gfx.cpp) is where the matching instructions live.

  

- **Compiler** — a program that translates your `.cpp`/`.h` text files into a binary

the machine can actually run. Here, that's `clang++`. Nothing runs until the

compiler has translated it.

  

- **`struct` / `class`** — a custom "form" you design, bundling related data together

with the actions that make sense for that data. In C++ `struct` and `class` are

almost the same thing; by convention we use `struct` for simple data bags (like

`Rct`, a rectangle) and `class` for things with more behavior (like `Notepad`).

  

- **Object** — one filled-out copy of a class/struct "form." `Win` is the blueprint

for "an open window"; the actual Notepad window you clicked open is one object made

from that blueprint.

  

- **Inheritance** (`class Notepad : public App`) — "a Notepad *is a kind of* App, so

it automatically gets everything an App has, and then adds or changes its own

specifics." Think of a generic "Employee" job description that "Cashier" and

"Manager" both inherit, then specialize.

  

- **Virtual function / polymorphism** — a placeholder action declared in the general

form (`App::draw()`) that every specific version fills in differently

(`Notepad::draw()` draws text, `Paint::draw()` draws a canvas). The rest of the

program can then call `app->draw()` without caring *which* app it actually is —

that's the trick that lets [desktop.cpp](src/desktop.cpp) manage seven totally

different programs with one line of code.

  

- **Pointer** — a variable holding the *location* of something in memory, rather than

the thing itself. Like a sticky note with a house's address on it, instead of the

house.

  

- **Smart pointer (`std::unique_ptr`)** — a pointer that automatically cleans up the

memory it owns the moment it's no longer needed, so you don't have to remember to

do it by hand. This single habit prevents two of the most classic (and classically

*exploitable*) categories of C++ bugs: memory leaks and use-after-free.

  

- **`std::vector`** — a list that can grow or shrink. `std::vector<std::string> lines`

in Notepad is just "however many lines of text currently exist."

  

- **`enum`** — a named list of whole numbers, so code can say `ICO_FOLDER` instead of

a bare, meaningless `2`. The compiler swaps the name for the number for you.

  

- **Event loop** — the heartbeat pattern behind essentially all real-time software

(games, GUIs, operating systems): *check for new input → update state → draw the

current state → show it on screen → repeat, forever, dozens of times a second.*

You'll see this explicitly in [main.cpp](src/main.cpp), and it's worth

understanding cold — it's everywhere once you know to look for it.

  

---

  

## 2. The big picture

  

Nine source files, each with one job:

  

```

main.cpp ─────────► opens the window, runs the event loop, shows boot/shutdown screens

│

▼

desktop.cpp ───────► the "office manager": owns every open window, the taskbar,

│ the Start menu, and routes every click/keypress to the right place

▼

apps_main.cpp ────► individual programs: Notepad, DOS Prompt, About, dialogs,

apps_extra.cpp Minesweeper, Paint, Calculator, Explorer — plus the fake filesystem

│

▼

gfx.cpp ───────────► the shared "paintbrush": every bevel, button, icon, and letter

on screen is drawn by calling into this file

  

os.h ──────────────► the rulebook everyone agrees to: shared types (Rct, FSNode) and

the two contracts — what an App must be able to do, and what

the OS promises to offer any App that asks

```

  

Nothing here talks directly to anything else without going through `os.h`'s

contracts. That's on purpose — it's the same reason a restaurant kitchen doesn't need

the servers to know how the grill works: everyone agrees on an order ticket format

(the contract), and then each side is free to change its own internals without

breaking the other.

  

---

  

## 3. [`src/os.h`](src/os.h) — the rulebook

  

This file defines nothing that *does* anything — it only declares shapes and

promises. That's what makes it a header.

  

**`Rct`** — the humble rectangle every piece of on-screen real estate is measured in:

  

```cpp

struct Rct {

int x = 0, y = 0, w = 0, h = 0;

bool has(int px, int py) const { return px >= x && py >= y && px < x + w && py < y + h; }

};

```

  

`has()` answers "is this (mouse) point inside me?" — the single most-called function

in the whole project, since every click has to be tested against buttons, windows,

menu items, and icons.

  

**The `enum`s** (`ICO_COMPUTER, ICO_BIN, ...` and `APP_NOTEPAD, APP_PAINT, ...`) — just

numbered name lists, so the rest of the code can say "draw `ICO_FOLDER`" or "open

`APP_CALC`" instead of tracking magic numbers by hand.

  

**`FSNode`** — one entry in the *fake filesystem* (there's no real disk access

anywhere in this project — it's an illusion built entirely from these objects):

  

```cpp

struct FSNode {

std::string name;

bool folder = false;

std::string content;

int icon = ICO_DOC;

int launch = -1;

std::vector<FSNode*> kids;

FSNode* parent = nullptr;

};

```

  

Each node knows its name, whether it's a folder, its text (if it's a file), which

program should open it, a list of its children, and a pointer back to its parent.

Chain enough of these together and you get a whole tree — "My Computer" at the root,

drives under it, folders under those, files at the tips. It's the same shape as a

family tree, just for folders instead of people.

  

**`App`** — the contract every program must sign. This is an *abstract class*: notice

every method ends in `= 0` or has a default body but is marked `virtual`. That means

"I'm not telling you *how* to draw yourself or handle a click — I'm just requiring

that you're *able* to." Notepad, Paint, Minesweeper, the Calculator, the DOS prompt,

the file Explorer, and every dialog box all separately promise to fulfill this same

contract, each in its own way.

  

**`OS`** — the contract in the other direction: what services the desktop offers to

any app that asks. `open()` a new program, pop up a `msgBox()`, `close()` yourself,

request the machine `power()` off or restart, or ask what time it is (`ticks()`).

[desktop.cpp](src/desktop.cpp) is the one file that actually keeps this promise.

  

---

  

## 4. [`src/font8x8.h`](src/font8x8.h) — the alphabet stamp set

  

Downloaded from a public-domain project, unmodified except for one small compatibility

fix. It is nothing but a giant table: for each of the 128 standard keyboard

characters, 8 numbers — one per row of an 8×8 pixel grid. Each number's individual

**bits** (a bit is the smallest unit a computer stores: a single 0 or 1) say whether

that pixel in the row is lit or dark.

  

That's the *entire* font in this project. There are no image files anywhere — every

letter you see on screen is stamped out of this one table, 8×8 pixels at a time.

  

---

  

## 5. [`src/gfx.h`](src/gfx.h) / [`src/gfx.cpp`](src/gfx.cpp) — the art supplies

  

If `os.h` is the rulebook, `gfx.cpp` is the paintbrush and ruler. It knows nothing

about Notepad or Minesweeper — its only job is turning an instruction like "draw a

raised button here" into actual colored pixels. Every other file draws by calling

into this one.

  

**The color constants** (`C_FACE`, `C_HI`, `C_LT`, `C_SH`, `C_DK`, …) are the exact

shades of grey (and that unmistakable teal) that make anything look like Windows 98.

  

**`GFX::init()`** takes the raw font8x8 table and "bakes" it once into a **texture** —

a picture that lives in the graphics card's own memory. It's built exactly once, at

startup, instead of being recalculated from the bit-table every single frame. That's

a basic but important performance habit: do expensive setup once, then reuse the

result.

  

**The bevel trick — `raised()` and `sunken()`** — is the single most recognizable

piece of the whole Windows 98 look:

  

```cpp

void GFX::raised(const Rct& r) {

fill(r, C_FACE);

hline(r.x, r.y, r.w - 1, C_LT); vline(r.x, r.y, r.h - 1, C_LT); // light top/left

hline(r.x, r.y + r.h - 1, r.w, C_DK); vline(r.x + r.w - 1, r.y, r.h, C_DK); // dark bottom/right

...

}

```

  

Draw a light line along the top and left edges of a box, and a dark line along the

bottom and right edges, and your eye reads it as a little 3D bump catching light from

the upper left. Flip light and dark and it reads as a dent instead (`sunken()`).

Every button, every window frame, every text box border in this project is built from

that one four-line trick, just at different sizes.

  

**`txt()` / `ch()`** draw text by copying 8×8 squares out of the pre-baked font

texture, one letter at a time.

  

**`bitmap()`** draws the hand-made icons. Each icon is stored as rows of plain

letters — `K` for black, `W` for white, `Y` for yellow, `.` for "skip this pixel" —

a simple paint-by-letters system you can literally read in the source and see the

picture. Open [gfx.cpp](src/gfx.cpp) and search for `I_FOLDER` to see one.

  

**`led()`** draws Minesweeper's red digital counters using classic **7-segment

display** logic — the same idea as a microwave clock or a basic calculator screen:

every digit 0–9 is made of 7 straight bars, and each digit is really just "which of

these 7 bars are lit."

  

**`VScroll`** is the scrollbar widget shared by Notepad, Explorer, and the DOS

prompt. It only needs to know three numbers — how many lines exist in total, how many

fit on screen at once, and which line is currently at the top — and from those it can

draw itself and turn mouse drags into a new scroll position.

  

---

  

## 6. [`src/desktop.h`](src/desktop.h) / [`src/desktop.cpp`](src/desktop.cpp) — the office manager

  

This is the biggest, most central file, and the one actually implementing the `OS`

contract from `os.h`.

  

**`Win`** is one open window: which `App` it holds, its rectangle on screen, whether

it's minimized or maximized, the size it should snap back to when un-maximized, and a

unique ID (used to keep taskbar button order stable even as windows are raised and

lowered).

  

**`Desktop::frame()`** runs roughly 60 times a second. Each call it: lets every open

app update itself (`tick()`), clears the screen, draws the desktop icons, draws every

window back-to-front (so the most recently focused one paints on top), draws any open

dropdown menu, draws the taskbar, and draws the Start menu if it's open.

  

**`Desktop::handle()`** is the traffic cop. Every mouse click or key press in the

whole program funnels through this one function, which has to figure out — in

order — "was that the Start menu? A dropdown menu? A taskbar button? A window's

close/minimize/maximize button? A window's title bar (start a drag)? A window's menu

bar? A window's actual content (forward it to the app)? A desktop icon? Or just empty

desktop?" That layered if-chain, checked top-to-bottom by what's currently

*on top of* everything else, is exactly how every real windowing system — Windows,

macOS, Linux desktops — resolves the same question.

  

**Focus** is the idea of "which window is currently active and receiving your

keyboard input" — always the *last* window in the internal list, since windows get

moved to the end of that list the moment you click them (`raise()`).

  

---

  

## 7. [`src/apps_main.cpp`](src/apps_main.cpp) — filesystem, Notepad, DOS prompt, dialogs

  

**The fake filesystem** (`fsInit()`) builds the entire "My Computer" tree once, at

startup, purely out of `FSNode` objects chained together with `parent`/`kids`

pointers — nothing here ever touches your Mac's real disk. It's populated with a

little in-joke content (a `readme.txt`, a `do not open` folder, a Recycle Bin with a

file called `homework_final_FINAL_v2.doc`).

  

**`Notepad`** stores its text as a `std::vector<std::string>` — one string per line —

plus a cursor row and column. Typing, backspace, delete, arrow keys, Enter, and Home/

End all just edit that vector and move the two cursor numbers around; drawing is

"print each visible line, then draw one blinking vertical bar at the cursor's exact

pixel position." Saving writes the joined-up text straight back into the `FSNode` it

came from — if you started from "Untitled" there's no real file underneath it, hence

the joke that "RAM is famously permanent."

  

**`Cmd`** (the MS-DOS Prompt) is a small **command interpreter**: it splits whatever

you typed into a command word and "the rest," lowercases the command word, and

matches it against a chain of `if`/`else if` checks (`dir`, `cd`, `type`, `echo`,

`cls`, `ver`, `date`, …). `DIR` and `CD` walk the exact same fake filesystem tree from

`fsInit()` — there's no separate "DOS filesystem," it's the same objects Explorer

browses.

  

**`About`**, **`MsgBox`**, and **`ShutdownDlg`** are all small, single-purpose dialog

boxes. `MsgBox` in particular is a reusable "OK" popup — every "insert a disk into

drive A:" or "file not found" message elsewhere in the project is really just this

one class, constructed with a different title/text/icon each time.

  

**The factory functions** at the bottom (`makeApp`, `makeMsgBox`, `makeShutdownDlg`)

are a small "vending machine": hand in an ID number, get back the correct kind of

`App` object, already built and ready to hand to the window manager.

  

---

  

## 8. [`src/apps_extra.cpp`](src/apps_extra.cpp) — Minesweeper, Paint, Calculator, Explorer

  

**`Mines`** is the classic game. Two ideas worth understanding well because they

reappear constantly in real software:

  

- *Deferred setup* — mines aren't placed until your very first click, specifically so

you can never lose immediately. `plant(except)` scatters mines everywhere except

the tile you just clicked.

- *Flood fill* — clicking an empty tile with zero neighboring mines should

automatically reveal all its neighbors, and their neighbors, and so on, like a

spreading puddle. `reveal()` does this with a `std::vector` used as a stack: pop a

tile, reveal it, and if it has no neighboring mines, push all of *its* unrevealed

neighbors on for the next round. This exact pattern — "keep a to-do list, process

one, maybe add more to the list, repeat until the list is empty" — is one of the

most broadly useful ideas in programming.

  

**`Paint`** keeps the entire picture as one big array of colors, one entry per pixel

(`std::vector<Uint32> pix`, sized 384×246). The pencil tool just writes a color into

that array at the mouse's position; the fill bucket is the *exact same flood-fill

idea* as Minesweeper's mine reveal, just spreading across matching colors instead of

empty tiles. `line()` implements **Bresenham's line algorithm**, a famously efficient

method (from 1962, originally for pen plotters) for drawing a straight line between

two points on a grid of pixels — needed here so that fast mouse movement doesn't

leave gaps between dots. Every frame, the whole `pix` array gets uploaded to the

graphics card as a texture and stretched to fill the canvas on screen.

  

**`Calc`** is a small **state machine** — the same logic every physical calculator

uses: keep the string currently on screen, a stored accumulator value, and which

operator (if any) is waiting to be applied. Press a digit, it builds the display

string; press `+`, it applies whatever's pending and remembers the new operator;

press `=`, it applies one final time.

  

**`Explorer`** re-uses the same `FSNode` tree from `apps_main.cpp` to show the

current folder's children as a clickable, scrollable list, with an "Up" button that

just follows each node's `parent` pointer.

  

---

  

## 9. [`src/main.cpp`](src/main.cpp) — the ignition switch

  

Every C++ program starts by running a function literally named `main()` — not a

convention, a hard rule the compiler enforces. This file is the whole program's

entry point and its outermost loop.

  

It uses **SDL2**, a free, widely-used library (real shipped games use it too) that

handles opening a window, reading mouse/keyboard input, and pushing pixels to the

screen — all the messy, OS-specific plumbing neither you nor this project wants to

write from scratch for both macOS and Windows.

  

**The virtual screen trick**: everything is drawn onto one fixed 800×600 texture,

which then gets scaled up or down to fit whatever size the *real* window actually is.

That's why resizing the window keeps everything crisp and chunky instead of

stretching blurrily or needing separate layout code for every window size.

  

**The boot sequence** (`PH_BIOS → PH_SPLASH → PH_RUN`) is just a small state machine

again, timed off `SDL_GetTicks()` (milliseconds elapsed since the program started),

that hands control to `Desktop` once the fake BIOS/splash screens finish.

  

**The main loop** is the textbook **event loop** mentioned in the glossary, written

out explicitly here:

  

```cpp

while (running) {

while (SDL_PollEvent(&e)) { /* 1. collect input */ }

/* 2. update state (phase transitions, desk->frame()'s tick) */

/* 3. draw the current state into the 800x600 texture */

/* 4. scale + present it to the real window */

}

```

  

Every game, every GUI app, and every real operating system's desktop is running some

version of this exact loop, just with far more going on inside step 2 and step 3.

  

**The `--smoke` flag and the `fuzz()` lambda** are a small homemade automated test:

run the program headless (no visible window) and fire a stream of *randomized* fake

clicks, drags, and key presses at it for hundreds of simulated frames, then report

whether anything crashed. This is a lightweight version of a real, respected security

and QA technique called **fuzz testing** — deliberately throwing unexpected or

malformed input at a program to find the bugs a normal, well-behaved test would never

stumble into. It's exactly the kind of tool defensive security and QA engineers use

professionally, and a good example of "security-adjacent" work that's entirely

legitimate and useful to learn.

  

---

  

## 10. [`CMakeLists.txt`](CMakeLists.txt) / [`build.sh`](build.sh) — turning text into a program

  

Source code is just text until a **compiler** (`clang++` here) translates it into a

binary the machine can execute. **CMake** is a "recipe generator": it looks at your

project once and writes out the exact low-level build instructions for whatever

platform you're building on, so the *same* `CMakeLists.txt` works unchanged on

macOS, Windows, and Linux — you're not hand-writing separate build steps for each.

  

`build.sh` is a shortcut for the same thing on macOS/Linux, and its `--app` flag

folds the compiled binary into a real double-clickable `CarlOS.app` — a folder with a

strict structure macOS recognizes, plus a small `Info.plist` file (just a bit of XML)

telling macOS the app's name and which file inside it to actually run.

  

---

  

## 11. How one single frame gets drawn, start to finish

  

Tracing one frame all the way through ties everything above together:

  

1. [main.cpp](src/main.cpp)'s loop asks SDL2 "any new input since last time?" and

forwards anything it finds to `desk->handle(...)`.

2. [desktop.cpp](src/desktop.cpp)'s `handle()` figures out what was clicked and

forwards it — maybe to a specific app's `mouse()`/`key()` method, maybe it's

consumed by the Start menu or taskbar instead.

3. Back in the loop, `desk->frame(g, mouseX, mouseY)` is called. It ticks every app,

then draws the desktop background, icons, every window, the taskbar, and any open

menus — all by calling into [gfx.cpp](src/gfx.cpp)'s drawing primitives

(`fill`, `raised`, `txt`, `icon16`, …).

4. Each app's own `draw()` method (in

[apps_main.cpp](src/apps_main.cpp)/[apps_extra.cpp](src/apps_extra.cpp)) is called

*by* `desktop.cpp`, and it also just calls into `gfx.cpp` to paint its own

contents inside its window rectangle.

5. All of that lands on the one 800×600 texture, which main.cpp then scales and

presents to the real window.

6. Repeat, ideally 60 times a second, forever.

  

---

  

## 12. C++ concepts, mapped to real lines in this project

  

| Concept | Where to see it | Why it's there |

|---|---|---|

| Inheritance | `class Notepad : public App` in [apps_main.cpp](src/apps_main.cpp) | Every app "is a kind of" App |

| Polymorphism / virtual functions | `App::draw()` overridden 7+ different ways | `desktop.cpp` can draw any app without knowing which one it is |

| Abstract interfaces | `OS` and `App` in [os.h](src/os.h) | Shared vocabulary two files agree on without seeing each other's internals |

| Smart pointers | `std::unique_ptr<App>` in `Win` ([desktop.h](src/desktop.h)) | A closed window's memory is freed automatically — no manual cleanup, no leaks |

| Recursive/tree data structures | `FSNode` with `parent`/`kids` | The whole fake filesystem is one tree of these |

| Stack-based flood fill | `Mines::reveal()`, `Paint::bucket()` | Same core algorithm, two different games |

| State machines | `Calc`, the `Phase` enum in main.cpp | "What should happen next" depends only on the current state + the new input |

| Enums | `ICO_*`, `APP_*` throughout | Named numbers instead of magic numbers |

| Operator/bit manipulation | `font8x8_basic[c][row] >> bit & 1` in [gfx.cpp](src/gfx.cpp) | Reading one single 0/1 pixel out of a packed number |

  

---

  

## 13. Where to go next

  

If you want to keep building C++ fundamentals from here, roughly in order of how

directly they build on what's already in this codebase:

  

1. **Memory & ownership** — read up on `unique_ptr` vs `shared_ptr` vs raw pointers,

and *why* C++ makes you think about this at all (unlike Python/JS). This project

leans on `unique_ptr` everywhere for exactly this reason.

2. **The STL** (`std::vector`, `std::string`, `std::map`) — you're already using

`vector` and `string` constantly here; `map` is the natural next container to learn.

3. **Const-correctness and references** (`const Rct& r`) — why so many function

parameters in `gfx.cpp` are written that way, and what it costs you if you get it

wrong.

4. **RAII** — the pattern behind smart pointers generalized: "acquire a resource in a

constructor, release it in a destructor," so cleanup can never be forgotten.

  

If cybersecurity is the actual destination, tell me more specifically which direction

(malware *analysis*, reverse engineering, detection engineering, pentesting, CTFs) —

each wants a meaningfully different next step, and I'd rather point you at the right

one than guess.****