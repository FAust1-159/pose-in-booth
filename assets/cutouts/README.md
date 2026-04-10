# Cutouts

Place your wall image assets in this folder.

## Naming Convention
- `running-wall.png`
- `jumping-wall.png`
- `dancing-wall.png`
- etc.

## Requirements
- Format: PNG with transparency preferred
- Recommended size: Match your camera resolution (e.g. 1280x720)
- The "hole" in the wall should be a clearly distinct region

## Important
After adding a new wall image here, register it in `js/wall.js`
under the `CUTOUTS` array, and define its corresponding polygon
coordinates so the scoring system knows where the hole is.
