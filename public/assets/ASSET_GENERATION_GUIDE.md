# ASSET GENERATION GUIDE — EpicEarthMMO

Guía completa de prompts para generar los recursos visuales del juego usando **Nano Banana 2** (Gemini 3.1 Flash Image).

---

## 1. SPECS TÉCNICAS

| Propiedad | Valor |
|-----------|-------|
| **Modelo** | Nano Banana 2 (Gemini 3.1 Flash Image) |
| **Resolución de generación** | 1024x1024 (luego escalar manualmente) |
| **Formato final** | PNG con fondo transparente |
| **Tamaño sprites personajes** | 64x64 px por frame |
| **Tamaño sprites enemigos** | 64x64 px por frame |
| **Tamaño iconos items/skills** | 24x24 px |
| **Estilo** | Pixel art, paleta limitada (8-16 colores por sprite) |
| **Direcciones personajes** | 8 direcciones (S, SW, W, NW, N, NE, E, SE) |
| **Direcciones enemigos** | 4 direcciones (S, W, N, E) |
| **Fondo** | Transparente (checkerboard) |
| **Paleta general** | RO-classic: tonos tierra, azules suaves, verdes pastel, rojos y dorados para items raros |

---

## 2. TÉCNICAS DE PROMPTING PARA NANO BANANA 2

### Estructura de prompt efectiva:

```
[Descripción del sujeto] + [Acción/pose] + [Ángulo/vista] + [Estilo pixel art] + [especificaciones técnicas]
```

### Keywords que funcionan:

| Keyword | Efecto |
|---------|--------|
| `pixel art` | Activa el estilo pixel art |
| `game sprite` | Mantiene la estética de sprite de juego |
| `transparent background` | Fondo transparente |
| `limited color palette, 16 colors` | Reduce paleta, evita gradientes |
| `clean pixel edges, no anti-aliasing` | Bordes duros, sin suavizado |
| `top-down view` / `side view` / `front view` | Controla el ángulo |
| `2d game asset` | Evita render 3D |
| `idle animation frame` / `walk cycle` | Define la animación |
| `consistent proportions` | Mantiene coherencia entre frames |

### Notas importantes:

- Nano Banana 2 genera a 1024x1024. El resultado se ve como pixel art pero NO está en una grilla limpia. Habrá que escalarlo manualmente al tamaño target usando interpolación "vecino más próximo" (point/nearest neighbor).
- Siempre especificar `transparent background` al inicio del prompt.
- Para spritesheets, generar primero los frames individuales o en tiras horizontales simples. El modelo tiene dificultad con grids complejos.
- Para mantener consistencia entre personajes, usa el mismo prompt base y cambia solo colores/armas.

---

## 3. FASES DE GENERACIÓN

---

### FASE 1 — SPRITE BASE DEL JUGADOR (NOVICE)

Prioridad máxima. Base para todos los personajes jugables.

#### 1.1 Novice — Hoja de direcciones (idle)

Generar 8 imágenes, una por dirección. Usar el mismo prompt cambiando solo la dirección.

**Prompt base:**
```
pixel art character sprite, young male novice adventurer, brown hair, blue tunic, beige pants, brown boots, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, standing idle pose, arms relaxed at sides, full body sprite
```

**Variantes por dirección:**

| Dirección | Modificar prompt |
|-----------|------------------|
| S (front) | `front view` |
| SW | `front-left view, 45 degrees` |
| W (left) | `left side view, profile` |
| NW | `back-left view, 45 degrees` |
| N (back) | `back view, seen from behind` |
| NE | `back-right view, 45 degrees` |
| E (right) | `right side view, profile` |
| SE | `front-right view, 45 degrees` |

**Output esperado:** 8 PNGs individuales, 1024x1024 cada uno → escalar a 64x64.

#### 1.2 Novice — Animación walk (8 direcciones)

Para cada dirección, generar 4 frames de ciclo de caminata.

**Prompt (ejemplo para front view):**
```
pixel art walk cycle sprite sheet, young male novice adventurer, brown hair, blue tunic, beige pants, brown boots, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, walking animation, 4 frames, left leg forward, right leg forward, arms swinging, full body sprite, horizontal strip layout
```

**Output esperado:** 8 tiras horizontales de 4 frames cada una → cortar y escalar cada frame a 64x64.

#### 1.3 Novice — Animación attack (8 direcciones)

**Prompt:**
```
pixel art attack animation sprite, young male novice adventurer with a small dagger, brown hair, blue tunic, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, stabbing forward pose, 3 frames: windup, strike, recovery, full body sprite
```

#### 1.4 Novice — Animación hit y dead

**Prompt hit:**
```
pixel art hit reaction sprite, young male novice adventurer, brown hair, blue tunic, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, knocked backward, arms flinching, 2 frames
```

**Prompt dead:**
```
pixel art death animation sprite, young male novice adventurer, brown hair, blue tunic, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, falling to knees then lying face down, 4 frames
```

#### 1.5 Novice — Variante femenina

Repetir prompts 1.1 a 1.4 cambiando:
- `young male` → `young female`
- `blue tunic` → `blue dress with white blouse`
- `brown hair` → `long brown hair in ponytail`

---

### FASE 2 — SPRITES DE ENEMIGOS

Generar para cada monstruo: 4 direcciones × (idle 2f + walk 2f + attack 2f + hit 1f + die 3f).

#### 2.1 Poring

**Prompt base idle:**
```
pixel art monster sprite, cute pink slime creature, round body, large happy eyes, small mouth, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, idle bouncing animation, 2 frames, full body sprite
```

**Prompt attack:**
```
pixel art monster sprite, cute pink slime creature, round body, large happy eyes, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, lunging forward to attack, 2 frames
```

**Prompt die:**
```
pixel art monster sprite, cute pink slime creature, round body, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, deflating and collapsing, 3 frames death animation
```

#### 2.2 Fabre

**Prompt base:**
```
pixel art monster sprite, giant green caterpillar, segmented body, small legs, antennae, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, crawling idle animation, 2 frames, full body sprite
```

#### 2.3 Pupa

**Prompt base:**
```
pixel art monster sprite, stationary brown cocoon, spiky shell, small glowing eyes peeking out, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, idle wobbling animation, 2 frames, full body sprite, no walking needed
```

#### 2.4 Lunatic

**Prompt base:**
```
pixel art monster sprite, white rabbit with curved horns, red eyes, small and agile, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, hopping idle animation, 2 frames, full body sprite
```

#### 2.5 Wolf

**Prompt base:**
```
pixel art monster sprite, gray wolf, snarling mouth, sharp teeth, yellow eyes, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, aggressive idle animation, 2 frames, full body sprite
```

#### 2.6 Spore

**Prompt base:**
```
pixel art monster sprite, giant blue mushroom, spotted cap, small stalk, angry face on the cap, 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, wobbling idle animation, 2 frames, full body sprite
```

**Para cada enemigo, repetir con variantes de dirección:** `front view`, `left side view`, `back view`, `right side view`.

---

### FASE 3 — ÍCONOS DE ITEMS

Todas las imágenes se generan individuales a 1024x1024 y se escalan a 24x24.

#### 3.1 Pociones y Consumibles

**Prompt template:**
```
pixel art game icon, [descripción del item], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, isometric view, centered, icon size, white background not required
```

| Item | Descripción |
|------|-------------|
| Red Potion | `small red potion bottle, glass, round, liquid inside, cork stopper` |
| Orange Potion | `medium orange potion bottle, glass, oval shape` |
| Yellow Potion | `tall yellow potion bottle, glass, rectangular` |
| White Potion | `medium white potion bottle, glass, with cross symbol` |
| Blue Potion | `small blue potion bottle, glass, teardrop shape` |
| Green Potion | `small green potion bottle, glass` |
| Fly Wing | `blue butterfly wing, glowing, delicate` |
| Butterfly Wing | `yellow butterfly wing, larger, detailed` |

#### 3.2 Armas

**Prompt template:**
```
pixel art game icon, [descripción del arma], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, front view, centered, icon size
```

| Item | Descripción |
|------|-------------|
| Knife | `small iron dagger, simple blade, leather handle` |
| Sword | `broadsword, steel blade, cross guard, black handle` |
| Falchion | `curved blade sword, gold trim` |
| Blade | `long thin sword, double edged` |
| Bastard Sword | `large two-handed sword, wide blade` |
| Staff | `wooden staff, with blue crystal at top` |
| Wand | `thin wand, white, with small gem` |
| Bow | `short wooden bow, unstrung, simple` |
| Crossbow | `small crossbow, iron, mechanical` |
| Mace | `iron mace, spiked head, short handle` |
| Hammer | `large war hammer, blunt head` |
| Axe | `battle axe, double blade` |
| Katar | `tri-bladed claw weapon, assassin style` |
| Dagger | `curved dagger, ornate handle, jeweled` |

#### 3.3 Armaduras

| Item | Descripción |
|------|-------------|
| Cotton Shirt | `simple white cotton shirt, folded` |
| Jacket | `brown leather jacket, folded` |
| Adventurer Coat | `green coat with gold buttons, folded` |
| Mantle | `blue cloth mantle with fur trim` |
| Chain Mail | `silver chainmail armor, folded` |
| Plate Armor | `steel plate armor, chest piece, shiny` |
| Robe | `long blue mage robe, folded` |
| Silk Robe | `white silk robe with gold embroidery` |

#### 3.4 Headgears

| Item | Descripción |
|------|-------------|
| Novice Cap | `small blue cloth cap, round, with brim` |
| Hat | `wide brim brown hat` |
| Beret | `red beret, French style` |
| Goggles | `steampunk goggles, brass frame, green lenses` |
| Glasses | `round wireframe glasses` |
| Ribbon | `red hair ribbon, bow shape` |
| Crown | `gold crown, with jewels` |
| Tiara | `silver tiara, with sapphire` |
| Flower | `red rose, worn on head` |

#### 3.5 Escudos

| Item | Descripción |
|------|-------------|
| Guard | `small round iron shield` |
| Buckler | `small wooden shield with metal rim` |
| Shield | `medium kite shield, blue with gold cross` |
| Mirror Shield | `round shield, reflective surface` |

#### 3.6 Accesorios y Materiales

| Item | Descripción |
|------|-------------|
| Ring | `gold ring with red gem` |
| Earring | `silver earring, teardrop pearl` |
| Necklace | `gold chain with sapphire pendant` |
| Clip | `silver hair clip` |
| Brooch | `gold brooch, flower shape, ruby` |
| Feather | `white bird feather` |
| Fur | `brown animal fur pelt` |
| Claw | `sharp animal claw` |
| Scale | `green dragon scale, shiny` |
| Stick | `simple wooden stick` |
| Stone | `round gray stone` |
| Flower | `blue flower, 3 petals` |
| Leaf | `green leaf, veined` |
| Mushroom | `red mushroom with white spots` |
| Poison Spore | `purple spore, glowing, toxic` |
| Empty Bottle | `empty glass bottle, transparent` |
| Iron Ore | `rough iron ore, gray, rocky` |
| Coal | `black coal chunk` |

#### 3.7 Arrows

| Item | Descripción |
|------|-------------|
| Arrow | `simple wooden arrow with iron tip` |
| Silver Arrow | `silver arrow with white fletching` |
| Fire Arrow | `arrow with red fletching, flame tip` |
| Ice Arrow | `arrow with blue fletching, icy tip` |

---

### FASE 4 — ÍCONOS DE SKILLS

Íconos de 24x24 con estilo RO: marco cuadrado con fondo semitransparente oscuro y el ícono centrado.

**Prompt template genérico:**
```
pixel art game skill icon, [descripción], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, centered, iconic, simple and readable at small size, dark square background
```

#### 4.1 Skills de Novice

| Skill | Descripción |
|-------|-------------|
| Basic Attack | `white sword on dark background, simple slash` |
| Improve Concentration | `open eye, yellow, focused` |

#### 4.2 Skills de Swordsman

| Skill | Descripción |
|-------|-------------|
| Bash | `grey fist, cracking impact lines` |
| Magnum Break | `explosion, orange and red, radial burst` |
| Two-Handed Sword Mastery | `two crossed swords, silver` |
| Taunt | `open mouth, red, aggressive` |
| Endure | `grey stone shield, sturdy` |

#### 4.3 Skills de Mage

| Skill | Descripción |
|-------|-------------|
| Fire Bolt | `fireball, orange and yellow, streaking` |
| Cold Bolt | `ice shard, blue and white, sharp` |
| Lightning Bolt | `lightning strike, yellow zigzag` |
| Fire Ball | `large fire sphere, explosive` |
| Frost Diver | `icicle spear, blue, falling` |
| Thunderstorm | `multiple lightning bolts, storm clouds` |
| Soul Strike | `purple ghostly orb, ethereal` |
| Napalm Beat | `blue energy wave, horizontal` |
| Energy Coat | `blue energy shield, hexagonal pattern` |
| Sight | `all-seeing eye, green, glowing` |

#### 4.4 Skills de Archer

| Skill | Descripción |
|-------|-------------|
| Double Strafe | `two arrows in flight, side by side` |
| Owl's Eye | `owl eye, golden, focused` |
| Vulture's Eye | `crosshair target, precise` |
| Arrow Shower | `multiple falling arrows spread` |

#### 4.5 Skills de Thief

| Skill | Descripción |
|-------|-------------|
| Double Attack | `two daggers crossed, slashing` |
| Envenom | `purple dagger, dripping poison` |
| Steal | `gloved hand, reaching, coin` |
| Hiding | `silhouette disappearing, gray` |
| Detect | `radar wave, blue, scanning` |

#### 4.6 Skills de Acolyte

| Skill | Descripción |
|-------|-------------|
| Heal | `green cross, glowing, holy light rays` |
| Cure | `white dove, flying upward` |
| Increase Agility | `running figure, blue speed lines` |
| Decrease Agility | `slow spiral, purple, downward` |
| Blessing | `golden star, radiant light` |
| Teleport | `swirling blue portal, magical` |
| Holy Light | `golden beam of light, vertical` |

---

### FASE 5 — ELEMENTOS UI

Todos los elementos UI se generan como PNGs a 1024x1024 y se escalan manteniendo bordes nítidos.

#### 5.1 Backgrounds de ventanas (9-slice)

**Prompt:**
```
pixel art game ui window background, dark gray stone texture border, 5 pixels wide border with beveled edges, dark semi-transparent center area, 2d game asset, transparent background, clean pixel edges, limited color palette, seamless tileable border corners
```

Generar 4 variantes:
- `window default` — borde gris oscuro, centro negro semitransparente
- `window highlighted` — borde dorado, centro azul muy oscuro
- `window shop` — borde marrón, centro marrón oscuro
- `window chat` — borde azul grisáceo, centro negro

#### 5.2 Botones

**Prompt:**
```
pixel art game ui button, rectangular, dark gray stone texture, beveled top edge lighter, beveled bottom edge darker, 2d game asset, transparent background, clean pixel edges, limited color palette, center area slightly lighter
```

Por estado:
- `normal` — como arriba
- `hover` — `button, golden glow border, brighter center`
- `pressed` — `button, pressed down, bevel inverted, darker center`
- `disabled` — `button, grayed out, low contrast, flat`

#### 5.3 Progress Bars

**Prompt:**
```
pixel art game ui progress bar background, dark gray slot, inset border, 2d game asset, transparent background, clean pixel edges, limited color palette
```

Y para los fill:
```
pixel art game ui progress bar fill, [color] gradient, pixel art, clean edges, limited palette, 2d game asset, transparent background
```

- `HP bar` — rojo oscuro a rojo brillante
- `SP bar` — azul oscuro a azul brillante
- `EXP bar` — celeste claro a azul claro

#### 5.4 Minimap

**Prompt:**
```
pixel art game ui minimap frame, rectangular, ornate golden border with corner decorations, dark background inside, 2d game asset, transparent background, clean pixel edges, limited color palette
```

#### 5.5 Hotbar slots

**Prompt:**
```
pixel art game ui hotbar slot, square, dark stone border, inset, 2d game asset, transparent background, clean pixel edges, limited color palette, individual slot icon
```

#### 5.6 Iconos UI generales

Generar a 24x24 escala final:

| Ícono | Descripción |
|-------|-------------|
| Menu Skills | `crossed sword and staff, crossed` |
| Menu Stats | `upward arrow chart, green` |
| Menu Equipment | `chest armor silhouette` |
| Menu Inventory | `backpack, brown leather` |
| Menu Party | `two small figures together` |
| Menu Friends | `two smiling faces` |
| Menu Settings | `gear icon, silver` |
| Close Button | `X mark, white, bold` |
| Minimize Button | `underscore, white` |
| Drag Handle | `four small dots, 2x2 grid` |
| Chat Bubble | `speech bubble outline` |
| Scroll Bar Track | `vertical dark groove` |
| Scroll Bar Thumb | `grippable rectangle, lighter` |
| Checkbox Empty | `small empty square box` |
| Checkbox Checked | `small square with white check mark` |
| Radio Empty | `small empty circle` |
| Radio Selected | `small circle with dot` |

#### 5.7 Marcos de retrato

**Prompt:**
```
pixel art game ui portrait frame, oval, ornate gold border, dark interior, medieval fantasy style, 2d game asset, transparent background, clean pixel edges, limited color palette
```

---

### FASE 6 — OVERLAYS DE EQUIPAMIENTO

Sprites que se renderizan sobre el personaje base. Mismas 8 direcciones que el jugador.

#### 6.1 Headgears

Cada headgear requiere 8 direcciones, mismo sistema que el sprite base.

**Prompt template:**
```
pixel art character headwear overlay sprite, [descripción], 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, should fit on a character head, floating item style
```

| Headgear | Descripción |
|----------|-------------|
| Novice Cap | `small blue round cap with short brim` |
| Straw Hat | `wide conical straw hat` |
| Beret | `red soft beret, tilted slightly` |
| Sun Glasses | `black rectangular sunglasses` |
| Goggles | `brass goggles over eyes, green lenses` |
| Crown | `gold crown with red and blue jewels` |
| Tiara | `elegant silver tiara with blue sapphire` |
| Flower Hairband | `white flower hairband on top of head` |
| Antlers | `brown deer antlers, branching` |
| Ribbon | `large red ribbon bow on head` |
| Eye Patch | `black eye patch covering one eye` |
| Hat | `wide brim wizard hat, blue with stars` |

#### 6.2 Weapons (vista en mano)

Cada weapon en 8 direcciones, mostrando el arma en posición de combate.

**Prompt:**
```
pixel art weapon sprite, [descripción], held in hand, combat position, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, floating item
```

#### 6.3 Shields (vista en brazo)

**Prompt:**
```
pixel art shield sprite, [descripción], held in left arm, defensive position, 2d game asset, transparent background, clean pixel edges, limited color palette 16 colors, front view, floating item
```

---

### FASE 7 — TILESETS DE MAPAS

Tiles de 32x32 para renderizado 3D del terreno.

#### 7.1 Tiles de terreno base

**Prompt template:**
```
pixel art top-down game tile, seamless, [descripción], 2d game asset, clean pixel edges, limited color palette 8 colors, tileable in both directions, orthographic top view
```

| Tile | Descripción |
|------|-------------|
| Grass 1 | `bright green grass texture, subtle variation` |
| Grass 2 | `medium green grass, slightly darker` |
| Grass 3 | `dark green grass with small flowers` |
| Dirt 1 | `light brown dirt, packed earth` |
| Dirt 2 | `dark brown dirt, small pebbles` |
| Stone 1 | `gray stone floor, flat paving` |
| Stone 2 | `dark gray stone, cobblestone pattern` |
| Water 1 | `blue water, calm, slight wave animation` |
| Water 2 | `deep blue water, darker` |
| Sand | `yellow-brown sand, granular` |
| Bridge | `wooden bridge horizontal, brown planks` |
| Bridge V | `wooden bridge vertical` |
| Snow | `white snow, light blue shadows` |
| Lava | `orange-red lava, glowing cracks` |

#### 7.2 Tiles de paredes y estructuras

**Prompt:**
```
pixel art top-down game wall tile, seamless, [descripción], 2d game asset, clean pixel edges, limited color palette 8 colors, orthographic top view
```

| Tile | Descripción |
|------|-------------|
| Stone Wall | `gray stone wall, mortar lines` |
| Brick Wall | `red brick wall, white mortar` |
| Wood Wall | `brown wooden planks, vertical` |
| Fence | `wooden fence horizontal, pickets` |
| Fence V | `wooden fence vertical` |
| Gate | `iron gate, black bars` |
| Hedge | `dark green hedge, rounded top` |

#### 7.3 Tiles decorativos

**Prompt:**
```
pixel art top-down game decoration tile, [descripción], 2d game asset, clean pixel edges, limited color palette 8 colors, orthographic top view
```

| Tile | Descripción |
|------|-------------|
| Sign | `wooden signpost, arrow pointing right` |
| Lamp Post | `iron lamp post, glowing yellow light` |
| Fountain | `circular stone fountain, blue water center` |
| Tree 1 | `green round tree top, brown trunk, from above` |
| Tree 2 | `pine tree top, dark green, pointed` |
| Bush | `small green rounded bush` |
| Flowers | `cluster of small red and yellow flowers` |
| Rock | `gray rounded rock, large` |
| Bench | `wooden park bench, brown` |
| Well | `circular stone well, roof, bucket` |
| Grave | `gray tombstone, cross behind` |
| Torch | `iron torch holder, orange flame` |
| Carpet | `red rectangular carpet, gold trim` |
| Stair Up | `stone stairs going up, shadow` |
| Stair Down | `stone stairs going down, shadow` |

---

### FASE 8 — EFECTOS VISUALES

Sprites para efectos de combate y magia. Generalmente una sola dirección (enfrentando).

#### 8.1 Efectos de impacto

**Prompt:**
```
pixel art visual effect sprite, [descripción], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, centered, animation frames as individual sprites
```

| Efecto | Descripción | Frames |
|--------|-------------|--------|
| Hit Spark | `white star burst, small, impact lines` | 3 |
| Slash | `curved white slash arc, sweeping` | 3 |
| Critical Hit | `large red starburst, jagged` | 4 |
| Miss | `white text effect, "MISS" in pixel font` | 3 |
| Block | `blue shield flash, circular ripple` | 3 |

#### 8.2 Efectos de hechizos

| Efecto | Descripción | Frames |
|--------|-------------|--------|
| Fire Bolt | `streaking fireball, orange and yellow, trailing flames` | 4 |
| Cold Bolt | `ice spear projectile, blue and white, frost trail` | 4 |
| Lightning Bolt | `zigzag yellow lightning bolt, bright flash` | 3 |
| Fire Ball | `expanding fire sphere, orange to red, explosion` | 5 |
| Frost Diver | `icicle falling diagonally, blue shatter on impact` | 4 |
| Heal | `green cross appearing, expanding holy light, golden sparkles` | 5 |
| Holy Light | `vertical golden beam from above, radiant` | 4 |
| Soul Strike | `purple ghost orb floating, ethereal trail` | 4 |
| Poison | `purple gas cloud expanding, bubbling` | 4 |
| Thunderstorm | `multiple lightning bolts from clouds, dark sky` | 5 |

**Prompt template:**
```
pixel art magic effect animation sprite, [descripción], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, centered, sequential animation frames
```

#### 8.3 Efectos de estado

| Efecto | Descripción |
|--------|-------------|
| Poisoned | `purple skull icon, dripping` |
| Stunned | `spiral stars around head` |
| Frozen | `blue ice crystals, snowflakes` |
| Burning | `orange flames, flickering` |
| Sleeping | `blue Z letters, floating` |
| Cursed | `purple inverted cross, dark glow` |
| Blessed | `golden glow, cross, light rays` |
| Silenced | `gray speech bubble with X` |

**Prompt:**
```
pixel art status effect icon overlay, [descripción], 2d game asset, transparent background, clean pixel edges, limited color palette 8 colors, centered, floating above head style, 2 animation frames
```

#### 8.4 Números flotantes

**Prompt:**
```
pixel art numbers 0-9, bold, white with black outline, game damage font, 2d game asset, transparent background, clean pixel edges, limited color palette, individual sprites for each digit, centered, readable at small size
```

Variantes de color:
- Damage normal → `white with black outline`
- Critical damage → `bright red with black outline`
- Heal → `bright green with black outline`
- EXP gain → `light blue with black outline`
- Miss → `gray with dark outline`

---

## 4. CONVENCIONES DE NOMENCLATURA Y CARPETAS

```
public/assets/
├── sprites/
│   ├── characters/
│   │   ├── novice_m/
│   │   │   ├── novice_m_idle_s.png       (dirección S)
│   │   │   ├── novice_m_idle_sw.png
│   │   │   ├── novice_m_idle_w.png
│   │   │   ├── novice_m_idle_nw.png
│   │   │   ├── novice_m_idle_n.png
│   │   │   ├── novice_m_idle_ne.png
│   │   │   ├── novice_m_idle_e.png
│   │   │   ├── novice_m_idle_se.png
│   │   │   ├── novice_m_walk_ss.png      (spritesheet 4 frames)
│   │   │   ├── novice_m_walk_sws.png
│   │   │   ├── ... (walk, attack, hit, dead para cada dirección)
│   │   └── novice_f/
│   │       └── (misma estructura)
│   └── monsters/
│       ├── poring/
│       │   ├── poring_idle_s.png
│       │   ├── poring_idle_w.png
│       │   ├── poring_idle_n.png
│       │   ├── poring_idle_e.png
│       │   └── ... (walk, attack, hit, dead)
│       ├── fabre/
│       ├── pupa/
│       ├── lunatic/
│       ├── wolf/
│       └── spore/
│
├── items/
│   ├── potion_red.png
│   ├── potion_orange.png
│   ├── sword_blade.png
│   ├── shield_guard.png
│   └── ... (todos los items como PNGs individuales)
│
├── skills/
│   ├── bash.png
│   ├── magnum_break.png
│   ├── fire_bolt.png
│   ├── heal.png
│   └── ... (todos los skills como PNGs individuales)
│
├── ui/
│   ├── windows/
│   │   ├── window_default.png
│   │   ├── window_highlight.png
│   │   ├── window_shop.png
│   │   └── window_chat.png
│   ├── buttons/
│   │   ├── btn_default.png
│   │   ├── btn_hover.png
│   │   ├── btn_pressed.png
│   │   └── btn_disabled.png
│   ├── bars/
│   │   ├── bar_bg.png
│   │   ├── bar_hp.png
│   │   ├── bar_sp.png
│   │   └── bar_exp.png
│   ├── icons/
│   │   ├── icon_skills.png
│   │   ├── icon_stats.png
│   │   ├── icon_equip.png
│   │   ├── icon_inventory.png
│   │   ├── icon_party.png
│   │   ├── icon_friends.png
│   │   ├── icon_settings.png
│   │   ├── btn_close.png
│   │   ├── btn_minimize.png
│   │   └── ... otros iconos UI
│   ├── minimap/
│   │   └── minimap_frame.png
│   ├── hotbar/
│   │   └── slot_bg.png
│   └── portraits/
│       └── portrait_frame.png
│
├── maps/
│   └── tilesets/
│       ├── grass_01.png
│       ├── grass_02.png
│       ├── dirt_01.png
│       ├── stone_01.png
│       ├── water_01.png
│       ├── wall_stone.png
│       ├── wall_wood.png
│       └── ... (todos los tiles)
│
└── effects/
    ├── hit_spark_01.png
    ├── hit_spark_02.png
    ├── hit_spark_03.png
    ├── slash_01.png
    ├── fire_bolt_01.png
    ├── fire_bolt_02.png
    ├── ... (frames de cada efecto)
    ├── status_poison.png
    ├── status_stun.png
    ├── status_frozen.png
    ├── status_burning.png
    └── digits/
        ├── digit_0.png
        ├── digit_1.png
        └── ... digit_9.png (por color)
```

---

## 5. CHECKLIST DE GENERACIÓN

Marca cada asset cuando esté generado y escalado.

### Fase 1 — Player Sprite
- [ ] Novice M idle (8 dirs × 1 frame)
- [ ] Novice M walk (8 dirs × 4 frames)
- [ ] Novice M attack (8 dirs × 3 frames)
- [ ] Novice M hit (8 dirs × 2 frames)
- [ ] Novice M dead (8 dirs × 4 frames)
- [ ] Novice F idle (8 dirs × 1 frame)
- [ ] Novice F walk (8 dirs × 4 frames)
- [ ] Novice F attack (8 dirs × 3 frames)
- [ ] Novice F hit (8 dirs × 2 frames)
- [ ] Novice F dead (8 dirs × 4 frames)

### Fase 2 — Enemies
- [ ] Poring (4 dirs × idle/walk/attack/hit/dead)
- [ ] Fabre (4 dirs × idle/walk/attack/hit/dead)
- [ ] Pupa (4 dirs × idle/attack/hit/dead — sin walk)
- [ ] Lunatic (4 dirs × idle/walk/attack/hit/dead)
- [ ] Wolf (4 dirs × idle/walk/attack/hit/dead)
- [ ] Spore (4 dirs × idle/attack/hit/dead — sin walk)

### Fase 3 — Items
- [ ] Potions (6)
- [ ] Wings (2)
- [ ] Weapons (14)
- [ ] Armors (8)
- [ ] Headgears (10)
- [ ] Shields (4)
- [ ] Accessories (6)
- [ ] Materials (12)
- [ ] Arrows (4)

### Fase 4 — Skills
- [ ] Novice (2)
- [ ] Swordsman (5)
- [ ] Mage (10)
- [ ] Archer (4)
- [ ] Thief (4)
- [ ] Acolyte (8)

### Fase 5 — UI
- [ ] Window backgrounds (4)
- [ ] Buttons (4 estados)
- [ ] Progress bars (bg + 3 fills)
- [ ] Minimap frame
- [ ] Hotbar slots
- [ ] UI icons (15)
- [ ] Portrait frames (2)

### Fase 6 — Equipment
- [ ] Headgears (12 tipos × 8 dirs)
- [ ] Weapons (vista mano)
- [ ] Shields (vista brazo)

### Fase 7 — Tilesets
- [ ] Terrain tiles (14)
- [ ] Wall tiles (7)
- [ ] Decoration tiles (16)

### Fase 8 — Effects
- [ ] Impact effects (4 × 3-4 frames)
- [ ] Spell effects (10 × 3-5 frames)
- [ ] Status effects (8 × 2 frames)
- [ ] Digit sprites (10 dígitos × 4 colores)

---

## 6. RECOMENDACIONES FINALES

1. **Generar en orden de fases** — Cada fase depende de la anterior.
2. **Mantener consistencia de paleta** — Usar siempre los mismos tonos de color para elementos similares (ex: todas las pociones rojas usan el mismo rojo base).
3. **Escalar con "vecino más próximo"** — Al reducir de 1024x1024 a 64x64 o 24x24, usar interpolación "Nearest Neighbor" (punto) para mantener bordes duros de pixel art.
4. **Verificar transparencia** — Confirmar que el fondo es realmente transparente (canal alpha) después de escalar.
5. **Backup de alta resolución** — Guardar siempre el PNG 1024x1024 original en una carpeta `_sources/` por si necesitas regenerar a diferente tamaño.
6. **Probar en el juego** — Montar un asset en el juego inmediatamente después de generarlo para verificar que se ve bien en contexto.
