/**
 * Isometric Grid & Coordinate Engine
 * Inspired by Supercell Clash of Clans & FarmVille Tile Matrices
 */

export type GridPosition = {
  gridX: number;
  gridY: number;
};

export type ScreenPosition = {
  x: number;
  y: number;
};

export type BuildingFootprint = {
  widthTiles: number;
  heightTiles: number;
};

export const TILE_WIDTH = 48;
export const TILE_HEIGHT = 24;

/**
 * Converts grid coordinates (gridX, gridY) to 2D isometric screen coordinates (x, y)
 */
export function gridToScreen(gridX: number, gridY: number, originX: number = 0, originY: number = 0): ScreenPosition {
  const x = originX + (gridX - gridY) * (TILE_WIDTH / 2);
  const y = originY + (gridX + gridY) * (TILE_HEIGHT / 2);
  return { x, y };
}

/**
 * Converts 2D screen coordinates to nearest isometric grid coordinates
 */
export function screenToGrid(screenX: number, screenY: number, originX: number = 0, originY: number = 0): GridPosition {
  const adjustedX = screenX - originX;
  const adjustedY = screenY - originY;

  const gridX = Math.floor((adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2);
  const gridY = Math.floor((adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2);

  return { gridX, gridY };
}

/**
 * Footprint specifications for town buildings
 */
export const BUILDING_FOOTPRINTS: Record<string, BuildingFootprint> = {
  'birlik-kulubu': { widthTiles: 3, heightTiles: 3 },
  'oyun-salonu': { widthTiles: 3, heightTiles: 3 },
  'kart-dukkani': { widthTiles: 2, heightTiles: 2 },
  'nikah-salonu': { widthTiles: 3, heightTiles: 3 },
  'alisveris-merkezi': { widthTiles: 2, heightTiles: 2 },
  'ciftlik': { widthTiles: 4, heightTiles: 3 },
  'kesif-rihtimi': { widthTiles: 3, heightTiles: 2 },
  'onur-listesi': { widthTiles: 2, heightTiles: 2 },
};
