import React from "react";

/* ============================================================
 * SlotMap
 * ============================================================
 */

export interface SlotMap {
  icon: IconSlot;
}

export type Slot = SlotMap[keyof SlotMap];

/* ============================================================
 * Slot Renderer
 * ============================================================
 */

export interface SlotEnvironment<TScope = never> {
  scope?: TScope;
}

export type SlotRendererFn<T, TScope = never> = (
  slot: T,
  env?: SlotEnvironment<TScope>,
) => React.ReactNode;

/* ============================================================
 * Icon Library Renderer
 * ============================================================
 */

export type IconLibraryRenderer<T> = (slot: T) => React.ReactNode;

/* ============================================================
 * Icon Library Map (augmented by icon libs)
 * ============================================================
 */

export interface IconLibraryMap {}

/* ============================================================
 * Icon Slot Types
 * ============================================================
 */

/**
 * Author-time icon slot
 * Library NOT known yet
 */
export interface UnresolvedIconSlot {
  type: "icon";
  library?: undefined;
}

/**
 * Runtime icon slot
 * Library IS known
 */
export type ResolvedIconSlot = {
  [L in keyof IconLibraryMap]: {
    type: "icon";
    library: L;
  } & IconLibraryMap[L];
}[keyof IconLibraryMap];

/**
 * Public icon slot
 */
export type IconSlot = UnresolvedIconSlot | ResolvedIconSlot;

/* ============================================================
 * Illustration Library (mirrors icon structure)
 * ============================================================
 */

export type IllustrationLibraryRenderer<T> = (slot: T) => React.ReactNode;

/** Augmented by storyset.library.slot.tsx, etc. */
export interface IllustrationLibraryMap {}

/**
 * Unresolved: library not set (filled from config at resolve time).
 */
export interface UnresolvedIllustrationSlot {
  type: "illustration";
  name: string;
  library?: undefined;
  style?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  [key: string]: unknown;
}

/**
 * Resolved: library is set; shape depends on library (from IllustrationLibraryMap).
 */
export type ResolvedIllustrationSlot = keyof IllustrationLibraryMap extends never
  ? UnresolvedIllustrationSlot & { library?: string }
  : {
      [L in keyof IllustrationLibraryMap]: {
        type: "illustration";
        library: L;
        name: string;
      } & IllustrationLibraryMap[L];
    }[keyof IllustrationLibraryMap];

export type IllustrationSlot = UnresolvedIllustrationSlot | ResolvedIllustrationSlot;

/* ============================================================
 * Flag Library (mirrors icon / illustration structure)
 * ============================================================
 */

export type FlagLibraryRenderer<T> = (slot: T) => React.ReactNode;

/** Augmented by flagpack.library.slot.tsx, etc. */
export interface FlagLibraryMap {}

/**
 * Unresolved: library not set (filled from config at resolve time).
 */
export interface UnresolvedFlagSlot {
  type: "flag";
  code: string;
  library?: undefined;
  size?: "sm" | "md" | "lg";
  [key: string]: unknown;
}

/**
 * Resolved: library is set; shape depends on library (from FlagLibraryMap).
 */
export type ResolvedFlagSlot = keyof FlagLibraryMap extends never
  ? UnresolvedFlagSlot & { library?: string }
  : {
      [L in keyof FlagLibraryMap]: {
        type: "flag";
        library: L;
        code: string;
      } & FlagLibraryMap[L];
    }[keyof FlagLibraryMap];

export type FlagSlot = UnresolvedFlagSlot | ResolvedFlagSlot;

/* ============================================================
 * File type library (mirrors flag / illustration)
 * ============================================================
 */

export type FileTypeLibraryRenderer<T> = (slot: T) => React.ReactNode;

/** Augmented by vscode.library.slot.tsx, etc. */
export interface FileTypeLibraryMap {}

export interface UnresolvedFileTypeSlot {
  type: "file-type";
  library?: undefined;
  [key: string]: unknown;
}

export type ResolvedFileTypeSlot = keyof FileTypeLibraryMap extends never
  ? UnresolvedFileTypeSlot & { library?: string }
  : {
      [L in keyof FileTypeLibraryMap]: {
        type: "file-type";
        library: L;
      } & FileTypeLibraryMap[L];
    }[keyof FileTypeLibraryMap];

export type FileTypeSlot = UnresolvedFileTypeSlot | ResolvedFileTypeSlot;

// import React from "react";

// /**
//  * Base slot every slot must have
//  */
// export type Slot = SlotMap[keyof SlotMap];

// /**
//  * Icon library renderer
//  * T = exact slot shape for that icon library
//  */
// export type IconLibraryRenderer<T> = (slot: T) => React.ReactNode;

// /**
//  * 🔥 This interface is intentionally EMPTY
//  * Each icon library will augment it
//  */
// export interface IconLibraryMap {}

// /**
//  * IconSlot
//  * ----------
//  * Discriminated by `library`
//  * Handles empty IconLibraryMap case by making it a base type
//  */
// export type IconSlot<L extends keyof IconLibraryMap = keyof IconLibraryMap> =
//   keyof IconLibraryMap extends never
//     ? {
//         type: "icon";
//         library?: string;
//       }
//     : {
//         type: "icon";
//         library?: L;
//       } & IconLibraryMap[L];

// /**
//  * SlotMap
//  * -------
//  * Central slot registry typing
//  */
// export interface SlotMap {
//   icon: IconSlot;
// }

// /**
//  * Slot renderer function
//  */
// export type SlotRendererFn<T> = (slot: T) => React.ReactNode;